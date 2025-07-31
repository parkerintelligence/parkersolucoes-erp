// React validation utility
import React from 'react';

export const validateReact = () => {
  if (typeof React === 'undefined' || React === null) {
    throw new Error('React is not available');
  }
  
  if (typeof React.useState === 'undefined' || React.useState === null) {
    throw new Error('React.useState is not available');
  }
  
  console.log('React validation passed:', {
    React: !!React,
    useState: !!React.useState,
    useEffect: !!React.useEffect,
    createContext: !!React.createContext
  });
  
  return true;
};