/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SplashScreen from '../screens/SplashScreen';
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import RecipesScreen from '../screens/RecipesScreen';
import AddRecipeScreen from '../screens/AddRecipeScreen';
import RecipeDetailPage from '../screens/RecipeDetailPage';
import ProfileScreen from '../screens/ProfileScreen';
import AddMemberScreen from '../screens/AddMemberScreen';
import ShoppingScreen from '../screens/ShoppingScreen';
import StockScreen from '../screens/StockScreen';
import AddShoppingItem from '../screens/AddShoppingItem';
import MarketMapScreen from '../screens/MarketMapScreen';
import AIGenerate from '../screens/AIGenerate'; 
import AddStockScreen from '../screens/AddStockScreen'; 
import EditStockScreen from '../screens/EditStockScreen'; 
import EditRecipeScreen from '../screens/EditRecipeScreen'; // NOUVEL IMPORT
import { Member } from '../screens/ProfileScreen';

// Types pour la navigation
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  Home: undefined;
  Recipes: undefined;
  AddRecipe: { recipe?: any };
  RecipeDetail: { recipe: any };
  Profile: undefined;
  AddMember: { memberToEdit?: Member; memberIndex?: number } | undefined;
  Shopping: undefined;
  Stock: undefined;
  AddShoppingItem: undefined;
  AIGenerate: undefined;
  AddStock: undefined;
  EditStock: { item: { name: string; quantity: string; expiry: string; status: 'good' | 'warning' | 'urgent' }; itemIndex: number }; 
  EditRecipe: { recipe: any };
  MarketMap: undefined;
};

// Type pour les props des écrans du Tab Navigator
type TabParamList = {
  Home: undefined;
  Recipes: undefined;
  Shopping: undefined;
  Stock: undefined;
  MarketMap: undefined;
  Profile: undefined;

};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Bottom Tabs Navigator pour les écrans principaux
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName: string = 'help';
        if (route.name === 'Home') {iconName = 'home';}
        else if (route.name === 'Recipes') {iconName = 'chef-hat';}
        else if (route.name === 'Shopping') {iconName = 'cart-outline';}
        else if (route.name === 'Stock') {iconName = 'package-variant-closed';}
        else if (route.name === 'Profile') {iconName = 'account';}
        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#f97316',
      tabBarInactiveTintColor: '#6B7280',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Recipes" component={RecipesScreen} />
    <Tab.Screen name="Shopping" component={ShoppingScreen} />
    <Tab.Screen name="Stock" component={StockScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddRecipe"
          component={AddRecipeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RecipeDetail"
          component={RecipeDetailPage}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddMember"
          component={AddMemberScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddShoppingItem"
          component={AddShoppingItem}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AIGenerate"
          component={AIGenerate}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddStock"
          component={AddStockScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditStock"
          component={EditStockScreen}
          options={{ headerShown: false }}
        />
        {/* NOUVEAU : Ajout de l'écran EditRecipe */}
        <Stack.Screen
          name="EditRecipe"
          component={EditRecipeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MarketMap" 
          component={MarketMapScreen} 
          options={{ headerShown: false }} />
        </Stack.Navigator>
      

    </NavigationContainer>
  );
};

export default AppNavigator;
