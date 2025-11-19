# Lichess Studies Scraper

A Python script to scrape chess studies from [Lichess](https://lichess.org/study) and download their PGN files.

## Features

- Scrapes study links from the Lichess studies page
- Downloads PGN files for each study
- Saves files with organized naming (e.g., `001_studyID.pgn`)
- Respectful rate limiting to avoid overloading the server
- Progress tracking and error handling

## Installation

1. Install Python 3.7 or higher

2. Install required dependencies:
```bash
pip install -r requirements.txt
```

## Usage

Run the script:
```bash
python scrape_lichess_studies.py
```

By default, the script will:
- Scrape 100 studies from Lichess
- Save PGN files to a folder named `lichess_studies`

## Customization

You can modify the script to change:

### Number of studies to scrape:
```python
scraper.scrape_studies(max_studies=50)  # Scrape 50 studies instead
```

### Output folder:
```python
scraper = LichessStudyScraper(output_folder="my_custom_folder")
```

### Rate limiting:
Adjust the `time.sleep()` values in the script (default is 1-2 seconds between requests)

## Output

The script creates a folder (default: `lichess_studies`) containing:
- PGN files named as `001_studyID.pgn`, `002_studyID.pgn`, etc.
- Each file contains the complete study with all chapters and variations

## Notes

- The script is respectful to Lichess servers with built-in rate limiting
- Some studies may fail to download due to access restrictions or network issues
- The script will continue even if individual downloads fail
- All PGN files are saved in UTF-8 encoding to preserve chess notation

## Disclaimer

This script is for educational purposes. Please respect Lichess's terms of service and use responsibly. Consider supporting [Lichess](https://lichess.org/patron) as they provide free chess resources to everyone.











