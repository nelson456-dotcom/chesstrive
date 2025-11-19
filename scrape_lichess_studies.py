"""
Lichess Studies Scraper
Scrapes chess studies from lichess.org/study and downloads their PGN files
"""

import requests
from bs4 import BeautifulSoup
import time
import os
from pathlib import Path
import re

class LichessStudyScraper:
    def __init__(self, output_folder="lichess_studies"):
        self.base_url = "https://lichess.org"
        self.study_list_url = f"{self.base_url}/study"
        self.output_folder = output_folder
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Create output folder if it doesn't exist
        Path(self.output_folder).mkdir(parents=True, exist_ok=True)
    
    def get_study_links(self, max_studies=100):
        """
        Scrape study links from the main studies page
        """
        print(f"Fetching studies from {self.study_list_url}...")
        study_links = []
        page = 1
        
        while len(study_links) < max_studies:
            try:
                # Lichess uses pagination
                url = f"{self.study_list_url}?page={page}"
                response = requests.get(url, headers=self.headers, timeout=10)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Find all study links - they typically have the pattern /study/[study_id]
                # Look for links in the study list
                study_elements = soup.find_all('a', href=re.compile(r'^/study/[a-zA-Z0-9]+$'))
                
                if not study_elements:
                    print(f"No more studies found on page {page}")
                    break
                
                for element in study_elements:
                    study_path = element['href']
                    study_url = f"{self.base_url}{study_path}"
                    
                    if study_url not in study_links:
                        study_links.append(study_url)
                        print(f"Found study {len(study_links)}: {study_url}")
                    
                    if len(study_links) >= max_studies:
                        break
                
                page += 1
                time.sleep(1)  # Be respectful to the server
                
            except Exception as e:
                print(f"Error fetching page {page}: {e}")
                break
        
        return study_links[:max_studies]
    
    def download_study_pgn(self, study_url, index):
        """
        Download PGN file for a specific study
        """
        try:
            # Extract study ID from URL
            study_id = study_url.split('/')[-1]
            
            # Lichess PGN download URL format
            pgn_url = f"{study_url}.pgn"
            
            print(f"Downloading PGN for study {index}: {study_id}...")
            response = requests.get(pgn_url, headers=self.headers, timeout=15)
            response.raise_for_status()
            
            # Save PGN file
            filename = f"{index:03d}_{study_id}.pgn"
            filepath = os.path.join(self.output_folder, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(response.text)
            
            print(f"✓ Saved: {filename}")
            return True
            
        except Exception as e:
            print(f"✗ Error downloading {study_url}: {e}")
            return False
    
    def scrape_studies(self, max_studies=100):
        """
        Main method to scrape and download studies
        """
        print(f"\n{'='*60}")
        print(f"Lichess Studies Scraper")
        print(f"{'='*60}\n")
        
        # Get study links
        study_links = self.get_study_links(max_studies)
        
        print(f"\n{'='*60}")
        print(f"Found {len(study_links)} studies. Starting downloads...")
        print(f"{'='*60}\n")
        
        # Download PGN files
        successful = 0
        failed = 0
        
        for index, study_url in enumerate(study_links, 1):
            if self.download_study_pgn(study_url, index):
                successful += 1
            else:
                failed += 1
            
            # Be respectful to the server
            time.sleep(2)
        
        # Summary
        print(f"\n{'='*60}")
        print(f"Download Complete!")
        print(f"{'='*60}")
        print(f"Successful: {successful}")
        print(f"Failed: {failed}")
        print(f"Output folder: {os.path.abspath(self.output_folder)}")
        print(f"{'='*60}\n")


def main():
    # Create scraper instance
    scraper = LichessStudyScraper(output_folder="lichess_studies")
    
    # Scrape 100 studies
    scraper.scrape_studies(max_studies=100)


if __name__ == "__main__":
    main()











