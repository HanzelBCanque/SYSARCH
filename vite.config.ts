import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:                  resolve(__dirname, 'index.html'),
        studentAuth:           resolve(__dirname, 'pages/student-auth.html'),
        facilitatorAuth:       resolve(__dirname, 'pages/facilitator-auth.html'),
        studentDashboard:      resolve(__dirname, 'pages/student-dashboard.html'),
        facilitatorDashboard:  resolve(__dirname, 'pages/facilitator-dashboard.html'),
      },
    },
  },
});
