"""Backend regression checks. Start python app.py, then run this file."""
import hashlib
import json
from pathlib import Path
import sqlite3
import sys
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

    def test_database_error_is_json(self):
        with patch.object(backend, 'get_db', side_effect=sqlite3.OperationalError('test failure')):
            response = backend.app.test_client().get('/api/lands')
            self.assertEqual(response.status_code, 503)
            self.assertEqual(response.get_json(), {'error':'Database temporarily unavailable.'})
        with patch.object(backend, 'find_land', side_effect=RuntimeError('test failure')):
            response = backend.app.test_client().get('/api/lands/DEMO-001')
            self.assertEqual(response.status_code, 500)
            self.assertEqual(response.get_json(), {'error':'Internal server error.'})

if __name__ == '__main__':
    unittest.main(verbosity=2)
