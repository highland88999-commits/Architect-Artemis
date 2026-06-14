# harvesting/media_downloader.py
"""
Downloads media assets (images, PDFs, videos) found during harvest.
Saves to organized domain-based folders.
"""

import logging
import mimetypes
from pathlib import Path
from typing import List, Tuple
from urllib.parse import urljoin, urlparse

import requests
from requests.exceptions import RequestException

logger = logging.getLogger(__name__)

class MediaDownloader:
    def __init__(self, base_dir: str = "data/media"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Artemis-Media-Downloader/1.0"
        })

    def download_from_html(self, html: str, page_url: str) -> List[Tuple[str, Path]]:
        """
        Find & download images, PDFs, etc. from HTML content.
        Returns list of (original_url, saved_path) tuples.
        """
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, "lxml")
        downloaded = []

        # Images
        for img in soup.find_all("img"):
            src = img.get("src") or img.get("data-src") or img.get("data-lazy-src")
            if not src:
                continue
            full_url = urljoin(page_url, src)
            path = self._download_asset(full_url, page_url)
            if path:
                downloaded.append((full_url, path))

        # PDFs & other documents
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if href.lower().endswith((".pdf", ".doc", ".docx")):
                full_url = urljoin(page_url, href)
                path = self._download_asset(full_url, page_url)
                if path:
                    downloaded.append((full_url, path))

        return downloaded

    def _download_asset(self, url: str, referer: str) -> Optional[Path]:
        """Download single asset with safety checks."""
        try:
            parsed = urlparse(url)
            if not parsed.scheme in ("http", "https"):
                return None

            ext = mimetypes.guess_extension(parsed.path) or ".bin"
            if ext in (".html", ".htm", ".php", ".asp"):
                return None  # avoid downloading pages

            domain = urlparse(referer).netloc.replace(".", "_")
            filename = Path(parsed.path).name or f"asset_{hash(url):x}{ext}"
            save_dir = self.base_dir / domain
            save_dir.mkdir(exist_ok=True)
            save_path = save_dir / filename

            if save_path.exists():
                logger.debug("Already downloaded: %s", save_path)
                return save_path

            with self.session.get(url, timeout=12, stream=True, headers={"Referer": referer}) as r:
                r.raise_for_status()
                content_type = r.headers.get("content-type", "")
                if "html" in content_type or "text" in content_type and len(r.content) < 50000:
                    logger.warning("Skipping suspicious content-type: %s", content_type)
                    return None

                with open(save_path, "wb") as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)

            logger.info("Downloaded media: %s → %s", url, save_path)
            return save_path

        except RequestException as e:
            logger.warning("Media download failed %s: %s", url, e)
            return None
        except Exception as e:
            logger.error("Unexpected error downloading %s: %s", url, e)
            return None


# CLI test
if __name__ == "__main__":
    downloader = MediaDownloader()
    # Example usage requires HTML content
    print("Run from harvest pipeline – no standalone CLI test implemented.")
