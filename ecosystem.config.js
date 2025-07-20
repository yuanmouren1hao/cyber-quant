module.exports = {
  apps: [{
    name: "quant-trading-system",
    script: "./src/index.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production"
    },
    env_development: {
      NODE_ENV: "development"
    }
  },
  {
    name: "quant-trading-web",
    script: "./src/web/server.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production"
    }
  },
  {
    name: "quant-trading-risk",
    script: "./src/risk/RiskManager.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "512M",
    env: {
      NODE_ENV: "production"
    }
  }]
};
