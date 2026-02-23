module.exports = {
    apps: [
        {
            name: "boletin360-api",
            script: "npm",
            args: "run start",
            cwd: "./server",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            exp_backoff_restart_delay: 100,
            kill_timeout: 3000,
            wait_ready: true,
            error_file: '../logs/api-error.log',
            out_file: '../logs/api-out.log',
            merge_logs: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            env: {
                NODE_ENV: "production",
                PORT: 3001
            }
        },
        {
            name: "boletin360-web",
            script: "npm",
            args: "start",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            exp_backoff_restart_delay: 100,
            env: {
                NODE_ENV: "production",
                PORT: 3000
            }
        }
    ]
};
