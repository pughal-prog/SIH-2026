import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.chatbot_engine import chatbot_engine


client = TestClient(app)

def test_gazetteer_autocomplete():
    res = chatbot_engine.search_autocomplete("Keonjhar", limit=3)
    assert len(res) > 0
    assert "Keonjhar" in res[0]["place_name"]

def test_in_coverage_prospectivity_query():
    res = chatbot_engine.query_prospectivity("Keonjhar")
    assert res["in_coverage"] is True
    assert "report" in res
    assert res["report"]["status"] == "IN_COVERAGE"
    assert "prospectivity_assessment" in res["report"]
    assert res["report"]["prospectivity_assessment"]["score"] >= 0.0

def test_out_of_coverage_query():
    res = chatbot_engine.query_prospectivity("Kochi")
    assert res["in_coverage"] is False
    assert "outside the currently modeled" in res["message"]
    assert res["report"]["status"] == "OUT_OF_COVERAGE"

def test_api_search_endpoint():
    response = client.get("/api/areas/search?q=Balaghat")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "Balaghat" in data[0]["place_name"]

def test_api_chatbot_query_endpoint():
    response = client.post("/api/chatbot/query", json={"area_name": "Sandur"})
    assert response.status_code == 200
    data = response.json()
    assert data["in_coverage"] is True
    assert data["report"]["prospectivity_assessment"]["category"] in ["High Priority", "Moderate Priority", "Low Priority / Background"]

def test_api_pdf_report_endpoint(tmp_path):
    response = client.post("/api/reports/pdf", json={"area_name": "Barbil"})
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 1000
