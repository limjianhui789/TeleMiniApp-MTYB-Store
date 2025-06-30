#!/bin/sh

# ============================================================================
# MTYB Shop - Docker Entrypoint Script
# ============================================================================

set -e

echo "Starting MTYB Shop application..."

# Validate environment
if [ "$NODE_ENV" = "production" ]; then
    echo "Running in production mode"
    
    # Check required environment variables
    if [ -z "$VITE_API_BASE_URL" ]; then
        echo "ERROR: VITE_API_BASE_URL is required in production"
        exit 1
    fi
    
    if [ -z "$VITE_CURLEC_PUBLIC_KEY" ]; then
        echo "ERROR: VITE_CURLEC_PUBLIC_KEY is required in production"
        exit 1
    fi
else
    echo "Running in development/staging mode"
fi

# Set proper permissions
chown -R nginx:nginx /usr/share/nginx/html
chown -R nginx:nginx /var/cache/nginx
chown -R nginx:nginx /var/log/nginx

# Test nginx configuration
nginx -t

# Start nginx
echo "Starting nginx..."
exec nginx -g "daemon off;"