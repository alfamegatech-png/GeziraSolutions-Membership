// lib/middleware.js

import Cors from 'cors';

// Initialize CORS middleware and return a function to use as middleware
export const initMiddleware = (middleware) => {
  return (req, res) => {
    return new Promise((resolve, reject) => {
      middleware(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(result);
      });
    });
  };
};

// Create and export the CORS middleware
export const cors = initMiddleware(
  Cors({
    methods: ['GET', 'HEAD', 'POST', 'OPTIONS'], // Specify the allowed HTTP methods
  })
);
