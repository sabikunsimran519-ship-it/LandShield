"""Assessment history tests use an isolated SQLite database."""
import hashlib
from datetime import datetime
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import app as backend
import database

class AssessmentTests(unittest.TestCase):
    def setUp(self):
        conn = backend.get_db()
        try:
            schema = conn.execute("SELECT sql FROM sqlite_master WHERE name = 'land'").fetchone()[0]
            land = dict(conn.execute('SELECT * FROM land ORDER BY id LIMIT 1').fetchone())
        finally:
            conn.close()
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / 'history.db'
        self.land = dict(land, id=101, land_id='HISTORY-A')
        self.other = dict(land, id=102, land_id='HISTORY-B', mutation_status='complete', dispute_status='clear')
        conn = sqlite3.connect(self.path)
        try:
            with conn:
                conn.execute(schema)
                columns = tuple(land)
                sql = 'INSERT INTO land (' + ', '.join(columns) + ') VALUES (' + ', '.join('?' for _ in columns) + ')'
                conn.executemany(sql, [tuple(row[key] for key in columns) for row in (self.land, self.other)])
        finally:
            conn.close()
        patcher = patch.object(database, 'DATABASE', self.path)
        patcher.start()
        self.addCleanup(patcher.stop)
        database.create_risk_assessments_table()
        self.client = backend.app.test_client()
        self.url = '/api/lands/HISTORY-A/assessments'

    def create(self, body=None, land_id='HISTORY-A'):
        kwargs = {'json': body} if body is not None else {}
        response = self.client.post('/api/lands/' + land_id + '/assessments', **kwargs)
        self.assertEqual(response.status_code, 201)
        return response.get_json()

    def history(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        return response.get_json()

    def test_create_default_assessment(self):
        result = self.create()
        self.assertEqual(result['land_id'], self.land['land_id'])
        self.assertEqual(result['assessment_type'], 'GENERAL')
        self.assertIsNone(result['note'])
        self.assertGreater(result['assessment_id'], 0)
        self.assertIsNotNone(datetime.fromisoformat(result['created_at']).utcoffset())
        self.assertEqual(result['disclaimer'], backend.SCREENING_DISCLAIMER)
        self.assertEqual(self.history()['count'], 1)

    def test_create_optional_metadata(self):
        note = "Initial assessment; owner's documents need review."
        result = self.create({'assessment_type':' pre_purchase ', 'note':note})
        self.assertEqual(result['assessment_type'], 'PRE_PURCHASE')
        self.assertEqual(result['note'], note)
        result = self.create({'assessment_type':'FOLLOW_UP', 'note':None})
        self.assertEqual(result['assessment_type'], 'FOLLOW_UP')
        self.create({})

    def test_empty_history(self):
        result = self.history()
        self.assertEqual(result['land_id'], self.land['land_id'])
        self.assertEqual(result['count'], 0)
        self.assertEqual(result['assessments'], [])

    def test_multiple_assessments_newest_first(self):
        first = self.create({'note':'First'})
        second = self.create({'note':'Second'})
        result = self.history()
        self.assertEqual(result['count'], 2)
        self.assertEqual([row['assessment_id'] for row in result['assessments']], [second['assessment_id'], first['assessment_id']])
        conn = database.get_db_connection()
        try:
            with conn:
                conn.execute('UPDATE risk_assessments SET created_at = ?', ('2026-01-01T00:00:00+00:00',))
        finally:
            conn.close()
        self.assertEqual([row['assessment_id'] for row in self.history()['assessments']], [second['assessment_id'], first['assessment_id']])

    def test_get_single_and_numeric_land_id(self):
        created = self.create()
        for land_id in ('HISTORY-A', str(self.land['id'])):
            response = self.client.get('/api/lands/' + land_id + '/assessments/' + str(created['assessment_id']))
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.get_json(), created)
        self.create(land_id=str(self.land['id']))
        self.assertEqual(self.client.get('/api/lands/101/assessments').get_json()['count'], 2)

    def test_assessment_belongs_to_requested_land(self):
        created = self.create()
        response = self.client.get('/api/lands/HISTORY-B/assessments/' + str(created['assessment_id']))
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json(), {'error':'Assessment not found.'})
        self.assertEqual(self.client.get('/api/lands/HISTORY-B/assessments').get_json()['count'], 0)

    def test_invalid_land_ids_and_missing_lands(self):
        for land_id, expected in [('0',400), ('bad%27id',400), ('MISSING',404), ('9'*64,404)]:
            for method, tail in [('get',''), ('post',''), ('get','/1')]:
                with self.subTest(land_id=land_id, method=method, tail=tail):
                    response = getattr(self.client, method)('/api/lands/' + land_id + '/assessments' + tail)
                    self.assertEqual(response.status_code, expected)
                    self.assertIn('error', response.get_json())
        self.assertEqual(self.history()['count'], 0)

    def test_invalid_and_missing_assessment_ids(self):
        for assessment_id in ('bad', '0', '-1', '1.5', '9'*64, str(2**63)):
            response = self.client.get(self.url + '/' + assessment_id)
            self.assertEqual(response.status_code, 400)
            self.assertIn('error', response.get_json())
        response = self.client.get(self.url + '/999')
        self.assertEqual(response.status_code, 404)
        response = self.client.get(self.url + '/')
        self.assertEqual(response.status_code, 404)

    def test_invalid_json_body(self):
        for data, content_type in [('not-json','application/json'), ('{','application/json'),
                                   ('null','application/json'), ('[]','application/json'),
                                   ('1','application/json'), ('true','application/json'),
                                   ('{}','text/plain')]:
            with self.subTest(data=data, content_type=content_type):
                response = self.client.post(self.url, data=data, content_type=content_type)
                self.assertEqual(response.status_code, 400)
                self.assertIn('error', response.get_json())
        self.assertEqual(self.history()['count'], 0)

    def test_invalid_assessment_type_and_note(self):
        for body in [{'assessment_type': value} for value in ('', 'INVALID', None, 1, [])] + [
                {'note':2000}, {'note':[]}, {'note':'x' * (backend.MAX_ASSESSMENT_NOTE_LENGTH + 1)}, {'note':'bad\x00note'}]:
            response = self.client.post(self.url, json=body)
            self.assertEqual(response.status_code, 400)
            self.assertIn('error', response.get_json())
        self.assertEqual(self.history()['count'], 0)
        self.create({'note':'x' * backend.MAX_ASSESSMENT_NOTE_LENGTH})

    def test_client_cannot_set_risk_values(self):
        for field in ('risk_score','risk_level','ownership_risk','document_risk','dispute_risk','acquisition_risk','khas_risk','land_id','created_at'):
            response = self.client.post(self.url, json={field:1})
            self.assertEqual(response.status_code, 400)
            self.assertIn('error', response.get_json())
        self.assertEqual(self.history()['count'], 0)

    def test_risk_values_use_existing_engine_and_history_is_snapshot(self):
        expected = backend.calculate_risk(self.land)
        saved = self.create()
        for field in ('ownership_risk','document_risk','dispute_risk','acquisition_risk','khas_risk','risk_level'):
            self.assertEqual(saved[field], expected[field])
        self.assertEqual(saved['risk_score'], expected['overall_score'])
        conn = database.get_db_connection()
        try:
            with conn:
                conn.execute('UPDATE land SET mutation_status = ?, dispute_status = ? WHERE id = ?', ('complete','clear',self.land['id']))
        finally:
            conn.close()
        new = self.create()
        changed = backend.calculate_risk(dict(self.land, mutation_status='complete', dispute_status='clear'))
        self.assertEqual(new['risk_score'], changed['overall_score'])
        self.assertNotEqual(saved['risk_score'], new['risk_score'])
        self.assertEqual(self.client.get(self.url + '/' + str(saved['assessment_id'])).get_json(), saved)

    def test_get_endpoints_and_what_if_do_not_save(self):
        self.create()
        before = hashlib.sha256(self.path.read_bytes()).hexdigest()
        for path in ['/api/lands','/api/lands/HISTORY-A','/api/lands/search'] + [
                '/api/lands/HISTORY-A/' + suffix for suffix in ('risk','documents','ai-analysis','location','what-if','report','assessments')]:
            for _ in range(2):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200)
        for query in ('dispute=resolved','mutation=complete','dispute=resolved&mutation=complete'):
            self.assertEqual(self.client.get('/api/lands/HISTORY-A/what-if?' + query).status_code, 200)
        self.assertEqual(self.history()['count'], 1)
        self.assertEqual(hashlib.sha256(self.path.read_bytes()).hexdigest(), before)

    def test_migration_is_idempotent_and_database_valid(self):
        self.create()
        database.create_risk_assessments_table()
        database.create_risk_assessments_table()
        self.assertEqual(self.history()['count'], 1)
        conn = backend.get_db()
        try:
            self.assertEqual(conn.execute('PRAGMA integrity_check').fetchone()[0], 'ok')
            self.assertEqual(conn.execute('PRAGMA foreign_key_check').fetchall(), [])
            self.assertEqual(dict(conn.execute('SELECT * FROM land WHERE id = ?', (self.land['id'],)).fetchone()), self.land)
        finally:
            conn.close()

    def test_database_errors_are_json_and_failed_insert_rolls_back(self):
        for method, path in [('get',self.url), ('post',self.url), ('get',self.url+'/1')]:
            with patch.object(backend, 'get_db', side_effect=sqlite3.OperationalError('test failure')):
                with self.assertLogs(backend.app.logger, level='ERROR'):
                    response = getattr(self.client, method)(path)
            self.assertEqual(response.status_code, 503)
            self.assertEqual(response.get_json(), {'error':'Database temporarily unavailable.'})
        with patch.object(backend, 'get_db_connection', side_effect=sqlite3.OperationalError('write failure')):
            with self.assertLogs(backend.app.logger, level='ERROR'):
                response = self.client.post(self.url)
        self.assertEqual(response.status_code, 503)
        conn = database.get_db_connection()
        try:
            with conn:
                conn.execute("CREATE TRIGGER reject_assessment BEFORE INSERT ON risk_assessments BEGIN SELECT RAISE(ABORT, 'test insert failure'); END")
        finally:
            conn.close()
        with self.assertLogs(backend.app.logger, level='ERROR'):
            response = self.client.post(self.url)
        self.assertEqual(response.status_code, 503)
        self.assertEqual(self.history()['count'], 0)
        conn = backend.get_db()
        try:
            self.assertEqual(conn.execute('PRAGMA integrity_check').fetchone()[0], 'ok')
        finally:
            conn.close()

if __name__ == '__main__':
    unittest.main(verbosity=2)
