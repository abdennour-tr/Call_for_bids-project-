from setuptools import setup, find_packages

setup(
    name="call-for-bids",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "Flask>=2.0",
        "flask-cors>=3.0",
        "requests>=2.25",
        "beautifulsoup4>=4.9",
    ],
    entry_points={
        'console_scripts': [
            'call-for-bids=app:main', 
        ],
    },
    author="Abdeour",
    description="Application Flask pour le scraping et affichage des appels d'offres marocains",
    python_requires='>=3.7',
)
