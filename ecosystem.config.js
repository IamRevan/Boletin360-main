module.exports = {
    apps: [
        {
            name: "boletin360-api",
            script: "./server/dist/index.js",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
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
            env: {
                NODE_ENV: "production",
                PORT: 3000
            }
        }
    ]
};
