# harvesting/tests/test_url_utils.py
import pytest
from url_utils import normalize_url  # assume you have this helper

@pytest.mark.parametrize(
    "input_url, base, expected",
    [
        ("/page", "https://example.com/", "https://example.com/page"),
        ("https://other.com", "https://example.com/", "https://other.com/"),
        ("https://example.com/page#fragment", "https://example.com/", "https://example.com/page"),
        ("invalid", "https://example.com/", None),
    ]
)
def test_normalize_url(input_url, base, expected):
    assert normalize_url(input_url, base) == expected
