module.exports = {
  ci: {
    collect: {
      url: [
        // process.env.TEMP_LHCI_URL,
        'http://localhost:8000/index.html',
        // 'https://elk.tornberg.me/',
      ],
      // startServerCommand: 'docker compose up -d',
      // startServerReadyPattern: 'ecom\\-sidecar\\-web(.)*Started',
      numberOfRuns: 3,
    },
    assert: {
      // https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md#assertions
      // https://github.com/GoogleChrome/lighthouse/blob/v5.5.0/lighthouse-core/config/default-config.js#L375-L407
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        //   "first-contentful-paint": "off",
        //   "installable-manifest": ["warn", {"minScore": 1}],
        //   "uses-responsive-images": ["error", {"maxLength": 0}]
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci',
      reportFilenamePattern:
        '%%HOSTNAME%%-%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%',
    },
    // server: {
    // },
    // wizard: {
    // },
  },
};
