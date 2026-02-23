#!/bin/bash

# 1. Install PM2 Logrotate module (if pm2 is available)
if command -v pm2 &> /dev/null; then
    echo "Installing pm2-logrotate..."
    pm2 install pm2-logrotate
    
    # Configure pm2-logrotate
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 7
    pm2 set pm2-logrotate:compress true
fi

# 2. Create standard Linux logrotate config for app logs
LOGROTATE_CONF="/etc/logrotate.d/boletin360"
APP_LOG_DIR="/home/ben/Coding Projects/Uni/Boletin360-main/logs"

echo "Creating logrotate configuration in $LOGROTATE_CONF..."

cat <<EOF | sudo tee $LOGROTATE_CONF
$APP_LOG_DIR/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0640 ben ben
    sharedscripts
}
EOF

echo "Log rotation setup complete."
