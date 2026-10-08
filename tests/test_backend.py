"""Backend regression checks. Start python app.py, then run this file."""
import hashlib
import json
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import urlopen, Request

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import app as backend
import database

SUFFIXES = ('', '/risk', '/documents', '/ai-analysis', '/location', '/what-if', '/report')

def fetch(path, method='GET'):
    try:
        response = urlopen(Request('http://127.0.0.1:5000' + path, method=method), timeout=5)
    except HTTPError as error:
        response = error
    with response:
        return response.code, json.loads(response.read())

class BackendTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.before = hashlib.sha256(database.DATABASE.read_bytes()).hexdigest()
        cls.land = dict(backend.find_land('DEMO-001'))

    @classmethod
    def tearDownClass(cls):
        after = hashlib.sha256(database.DATABASE.read_bytes()).hexdigest()
        if after != cls.before:
            raise AssertionError('Database changed during backend checks')
        if dict(backend.find_land('DEMO-001')) != cls.land:
            raise AssertionError('Stored land changed during backend checks')
        print('Database SHA-256 unchanged:', after)

    def test_all_live_endpoints(self):
        status, lands = fetch('/api/lands')
        self.assertEqual(status, 200)
        self.assertIn(self.land, lands)
        for suffix in SUFFIXES:
            with self.subTest(suffix=suffix):
                status, result = fetch('/api/lands/DEMO-001' + suffix)
                self.assertEqual(status, 200)
                self.assertIsInstance(result, dict)
        status, numeric = fetch('/api/lands/' + str(self.land['id']))
        self.assertEqual(status, 200)
        self.assertEqual(numeric, self.land)

    def test_live_error_responses(self):
        for suffix in SUFFIXES:
            for land_id, expected in [('UNKNOWN-LAND', 404), ('0', 400), ('bad%27id', 400), ('9'*64, 404)]:
                with self.subTest(suffix=suffix, land_id=land_id):
                    status, result = fetch('/api/lands/' + land_id + suffix)
                    self.assertEqual(status, expected)
                    self.assertIn('error', result)
        for path in ['/api/lands/'] + ['/api/lands/' + suffix for suffix in SUFFIXES if suffix]:
            status, result = fetch(path)
            self.assertEqual(status, 404)
            self.assertIn('error', result)
        status, result = fetch('/api/lands/DEMO-001/risk', method='POST')
        self.assertEqual(status, 405)
        self.assertIn('error', result)
        for query in ['dispute=invalid', 'mutation=invalid', 'unknown=value', 'dispute=', 'dispute=active&dispute=resolved', 'mutation=complete&mutation=pending']:
            status, result = fetch('/api/lands/DEMO-001/what-if?' + query)
            self.assertEqual(status, 400)
            self.assertIn('error', result)

    def test_live_scenarios_use_engine(self):
        current = backend.calculate_risk(self.land)
        scenarios = [{}, {'dispute':'resolved'}, {'mutation':'complete'}, {'dispute':'resolved','mutation':'complete'}, {'dispute':'active'}, {'mutation':'pending'}, {'dispute':'active','mutation':'pending'}]
        for scenario in scenarios:
            with self.subTest(scenario=scenario):
                status, result = fetch('/api/lands/DEMO-001/what-if?' + urlencode(scenario))
                expected_land = dict(self.land)
                expected_land.update({key + '_status': value for key, value in scenario.items()})
                expected = backend.calculate_risk(expected_land)
                self.assertEqual(status, 200)
                self.assertEqual(result['current']['overall_score'], current['overall_score'])
                self.assertEqual(result['simulated'], {'overall_score':expected['overall_score'], 'risk_level':expected['risk_level']})
                self.assertIn(backend.SCREENING_DISCLAIMER, result['disclaimer'])
                print('What-if:', scenario, result['simulated'])
        changed_land = dict(self.land, acquisition_status='active', khas_status='yes', khatian_no=None)
        untouched = dict(changed_land)
        simulated = backend.simulate_land_risk(changed_land, {'mutation':'complete','dispute':'resolved'})
        expected = backend.calculate_risk(dict(changed_land, mutation_status='complete', dispute_status='resolved'))
        self.assertEqual(simulated['simulated']['overall_score'], expected['overall_score'])
        self.assertEqual(changed_land, untouched)
        self.assertNotEqual(simulated['simulated']['overall_score'], backend.simulate_land_risk(self.land, {'mutation':'complete','dispute':'resolved'})['simulated']['overall_score'])

    def test_risk_weighting_and_thresholds(self):
        for score, expected in [(0,'LOW'), (30,'LOW'), (31,'MEDIUM'), (60,'MEDIUM'), (61,'HIGH'), (100,'HIGH')]:
            self.assertEqual(backend.risk_level(score), expected)
        result = backend.calculate_risk(self.land)
        weights = {'ownership':25, 'documents':20, 'dispute':25, 'acquisition':15, 'khas':15}
        expected = (sum(result['categories'][key]['score'] * weight for key, weight in weights.items()) + 50) // 100
        self.assertEqual(result['overall_score'], expected)

    def test_live_location(self):
        status, result = fetch('/api/lands/DEMO-001/location')
        self.assertEqual(status, 200)
        for key in ['latitude','longitude','district','upazila','mouza']:
            self.assertEqual(result['location'][key], self.land[key])
        self.assertEqual(result['location']['accuracy'], 'DEMO / APPROXIMATE')
        self.assertEqual(result['boundary_accuracy'], 'DEMO / APPROXIMATE')
        self.assertEqual(result['terrain']['source'], 'DEMO / APPROXIMATE')
        ring = result['boundary_geojson']['coordinates'][0]
        self.assertEqual(result['boundary_geojson']['type'], 'Polygon')
        self.assertEqual(ring[0], ring[-1])
        for longitude, latitude in ring:
            self.assertLess(abs(longitude - self.land['longitude']), 1)
            self.assertLess(abs(latitude - self.land['latitude']), 1)
        unavailable = backend.location_for_land(dict(self.land, land_id='OTHER', latitude=None, longitude=None))
        self.assertIsNone(unavailable['boundary_geojson'])
        self.assertFalse(unavailable['terrain']['available'])
        print('Location:', result['location'], 'Boundary and terrain:', result['boundary_accuracy'], result['terrain']['source'])

    def test_live_report_reuses_results(self):
        status, report = fetch('/api/lands/DEMO-001/report')
        self.assertEqual(status, 200)
        for field, endpoint in [('risk','risk'), ('document_verification','documents'), ('ai_analysis','ai-analysis')]:
            self.assertEqual(report[field], fetch('/api/lands/DEMO-001/' + endpoint)[1])
        location = fetch('/api/lands/DEMO-001/location')[1]
        for key, value in location.items():
            self.assertEqual(report[key], value)
        for key, value in report['land_information'].items():
            self.assertEqual(value, self.land[key])
        scenarios = [{}, {'dispute':'resolved'}, {'mutation':'complete'}, {'dispute':'resolved','mutation':'complete'}]
        for example, scenario in zip(report['what_if']['examples'], scenarios):
            result = fetch('/api/lands/DEMO-001/what-if?' + urlencode(scenario))[1]['simulated']
            self.assertEqual(example['overall_score'], result['overall_score'])
            self.assertEqual(example['risk_level'], result['risk_level'])
        self.assertEqual(report['final_recommendation']['reason'], report['ai_analysis']['recommendation'])
        self.assertIn(backend.SCREENING_DISCLAIMER, report['disclaimer'])
        print('Report decision:', report['final_recommendation']['decision'])

    def test_live_search(self):
        queries = ['', 'district=Dhaka', 'upazila=Savar', 'mouza=Demo%20Mouza',
                   'risk_level=MEDIUM', 'district=Dhaka&upazila=Savar',
                   'district=Dhaka&risk_level=MEDIUM',
                   'district=Dhaka&upazila=Savar&risk_level=MEDIUM',
                   'owner_name=demo', 'district=dh', 'risk_level=medium']
        for query in queries:
            with self.subTest(query=query):
                status, result = fetch('/api/lands/search?' + query)
                self.assertEqual(status, 200)
                self.assertEqual(result['count'], len(result['lands']))
                self.assertIn(self.land['land_id'], [row['land_id'] for row in result['lands']])
                for row in result['lands']:
                    risk = fetch('/api/lands/' + row['land_id'] + '/risk')[1]
                    self.assertEqual(row['risk_score'], risk['overall_score'])
                    self.assertEqual(row['risk_level'], risk['risk_level'])
                print('Search:', query or '(all)', result['count'], 'result(s)')
        status, result = fetch('/api/lands/search?risk_level=INVALID')
        self.assertEqual(status, 400)
        self.assertIn('error', result)
        status, result = fetch('/api/lands/search?district=NO-MATCH-DISTRICT')
        self.assertEqual(status, 200)
        self.assertEqual(result['lands'], [])
        self.assertEqual(result['count'], 0)

    def test_database_error_is_json(self):
        with patch.object(backend, 'get_db', side_effect=sqlite3.OperationalError('test failure')):
            response = backend.app.test_client().get('/api/lands')
            self.assertEqual(response.status_code, 503)
            self.assertEqual(response.get_json(), {'error':'Database temporarily unavailable.'})
        with patch.object(backend, 'find_land', side_effect=RuntimeError('test failure')):
            response = backend.app.test_client().get('/api/lands/DEMO-001')
            self.assertEqual(response.status_code, 500)
            self.assertEqual(response.get_json(), {'error':'Internal server error.'})

class SearchTests(unittest.TestCase):
    """Exercise SQL against an isolated database; never change project records."""
    def setUp(self):
        with backend.get_db() as conn:
            schema = conn.execute("SELECT sql FROM sqlite_master WHERE name = ?", ('land',)).fetchone()[0]
            base = dict(conn.execute('SELECT * FROM land ORDER BY id LIMIT 1').fetchone())
        conn.close()
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / 'search.db'
        self.rows = [
            dict(base, id=101, land_id='SEARCH-A', owner_name='Alice Example', district='Dhaka',
                 upazila='Savar', mouza='North Mouza', mutation_status='complete', dispute_status='clear',
                 acquisition_status='clear', khas_status='no'),
            dict(base, id=102, land_id='SEARCH-B', owner_name='BOB EXAMPLE', district='Dhaka',
                 upazila='Dhamrai', mouza=None, mutation_status='pending', dispute_status='resolved',
                 acquisition_status='clear', khas_status='no'),
            dict(base, id=103, land_id='SEARCH-C', owner_name='Straße Owner', district='Chattogram',
                 upazila='Savar', mouza='South Mouza', mutation_status='conflict', dispute_status='active',
                 acquisition_status='active', khas_status='yes'),
            dict(base, id=104, land_id='SPECIAL-%_ID', owner_name="O'Neil %_", district='Sylhet',
                 upazila='Central', mouza='Literal', mutation_status='complete', dispute_status='clear',
                 acquisition_status='clear', khas_status='no'),
        ]
        with sqlite3.connect(self.path) as conn:
            conn.execute(schema)
            columns = tuple(base)
            query = 'INSERT INTO land (' + ', '.join(columns) + ') VALUES (' + ', '.join('?' for _ in columns) + ')'
            conn.executemany(query, [tuple(row[column] for column in columns) for row in self.rows])
        conn.close()
        self.before = hashlib.sha256(self.path.read_bytes()).hexdigest()
        def connection():
            conn = sqlite3.connect(self.path.as_uri() + '?mode=ro', uri=True)
            conn.row_factory = sqlite3.Row
            return conn
        patcher = patch.object(backend, 'get_db', side_effect=connection)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.client = backend.app.test_client()

    def tearDown(self):
        self.assertEqual(hashlib.sha256(self.path.read_bytes()).hexdigest(), self.before)

    def search(self, filters=None):
        response = self.client.get('/api/lands/search', query_string=filters or {})
        self.assertEqual(response.status_code, 200)
        result = response.get_json()
        self.assertEqual(result['count'], len(result['lands']))
        return result

    def assert_ids(self, result, *ids):
        self.assertEqual([row['id'] for row in result['lands']], list(ids))

    def test_search_all_and_response_format(self):
        result = self.search()
        self.assert_ids(result, 101, 102, 103, 104)
        self.assertEqual(result['filters'], dict.fromkeys(('land_id','district','upazila','mouza','owner_name','risk_level')))
        for original, row in zip(self.rows, result['lands']):
            risk = backend.calculate_risk(original)
            self.assertEqual(set(row), {'id','land_id','owner_name','district','upazila','mouza','risk_score','risk_level'})
            self.assertEqual(row['risk_score'], risk['overall_score'])
            self.assertEqual(row['risk_level'], risk['risk_level'])

    def test_district_filter(self):
        self.assert_ids(self.search({'district':'Dhaka'}), 101, 102)

    def test_upazila_filter(self):
        self.assert_ids(self.search({'upazila':'Savar'}), 101, 103)

    def test_mouza_filter(self):
        self.assert_ids(self.search({'mouza':'Mouza'}), 101, 103)

    def test_owner_filter(self):
        self.assert_ids(self.search({'owner_name':'Alice'}), 101)

    def test_case_insensitive_partial_and_unicode(self):
        for filters, ids in [({'district':'dH'}, (101,102)), ({'owner_name':'bob'}, (102,)),
                             ({'mouza':'nOrTh'}, (101,)), ({'owner_name':'STRASSE'}, (103,))]:
            with self.subTest(filters=filters):
                self.assert_ids(self.search(filters), *ids)

    def test_risk_filters_use_existing_engine(self):
        for level in ('LOW','MEDIUM','HIGH'):
            expected = [row['id'] for row in self.rows if backend.calculate_risk(row)['risk_level'] == level]
            self.assertTrue(expected)
            result = self.search({'risk_level':level.lower()})
            self.assert_ids(result, *expected)
            self.assertEqual(result['filters']['risk_level'], level)

    def test_multiple_filters_are_and(self):
        self.assert_ids(self.search({'district':'Dhaka','upazila':'Savar'}), 101)
        self.assert_ids(self.search({'district':'Dhaka','risk_level':'MEDIUM'}), 102)
        self.assert_ids(self.search({'district':'Dhaka','upazila':'Savar','risk_level':'LOW'}), 101)
        self.assert_ids(self.search({'district':'Dhaka','upazila':'Savar','risk_level':'HIGH'}))
        self.assert_ids(self.search({'land_id':'SEARCH-A','owner_name':'Alice','district':'Dhaka',
                                     'upazila':'Savar','mouza':'North','risk_level':'LOW'}), 101)

    def test_public_partial_and_numeric_ids(self):
        self.assert_ids(self.search({'land_id':'search-a'}), 101)
        self.assert_ids(self.search({'land_id':'SEARCH'}), 101, 102, 103)
        self.assert_ids(self.search({'land_id':'101'}), 101)
        self.assert_ids(self.search({'land_id':'000101','district':'Dhaka'}), 101)
        self.assert_ids(self.search({'land_id':'9'*100}))
        response = self.client.get('/api/lands/101')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['land_id'], 'SEARCH-A')

    def test_no_results(self):
        result = self.search({'district':'Unknown District'})
        self.assert_ids(result)
        self.assertEqual(result['count'], 0)

    def test_sql_values_are_literal_and_parameterized(self):
        self.assert_ids(self.search({'owner_name':"' OR 1=1 --"}))
        self.assert_ids(self.search({'owner_name':"O'Neil"}), 104)
        self.assert_ids(self.search({'owner_name':'%_'}), 104)
        self.assert_ids(self.search({'land_id':'%_'}), 104)

    def test_malformed_parameters(self):
        for query in ['risk_level=INVALID', 'risk_level=', 'district=', 'district=%20%20',
                      'district=Dhaka&district=Sylhet', 'unknown=value', 'district=%00', 'owner_name=%0A']:
            with self.subTest(query=query):
                response = self.client.get('/api/lands/search?' + query)
                self.assertEqual(response.status_code, 400)
                self.assertIn('error', response.get_json())
        result = self.search({'district':'  Dhaka  ', 'risk_level':' low '})
        self.assert_ids(result, 101)
        self.assertEqual(result['filters']['district'], 'Dhaka')
        self.assertEqual(result['filters']['risk_level'], 'LOW')

    def test_database_failure(self):
        with patch.object(backend, 'get_db', side_effect=sqlite3.OperationalError('test failure')):
            with self.assertLogs(backend.app.logger, level='ERROR'):
                response = self.client.get('/api/lands/search')
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.get_json(), {'error':'Database temporarily unavailable.'})


if __name__ == '__main__':
    unittest.main(verbosity=2)
