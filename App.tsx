import React from 'react';
import { AppProvider } from './src/context/AppContext';
import AppNavigation from './src/navigation/AppNavigator';

const App = () => (
  <AppProvider>
    <AppNavigation />
  </AppProvider>
);

export default App;
