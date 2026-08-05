#!/usr/bin/env bash
# exit on error
set -o errexit

pip install --upgrade pip
pip install -r ../requirements.txt
pip install whitenoise gunicorn daphne

python manage.py collectstatic --no-input
python manage.py createcachetable
python manage.py migrate

# Create or reset the admin superuser
python manage.py create_admin

# Seed 9 services and 27 sub-services with images
python manage.py seed_services
