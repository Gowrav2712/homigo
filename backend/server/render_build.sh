#!/usr/bin/env bash
# exit on error
set -o errexit

pip install --upgrade pip
pip install -r ../requirements.txt
pip install whitenoise gunicorn daphne

python manage.py collectstatic --no-input
python manage.py migrate

# Create or reset the admin superuser
python manage.py create_admin
