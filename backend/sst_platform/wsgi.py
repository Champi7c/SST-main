"""
WSGI config for SST Platform project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sst_platform.settings')

application = get_wsgi_application()
