import { Theme } from '@react-navigation/native';

/**
 * This file is a necessary bridge between our CSS variable-based theme
 * and the JavaScript object-based theme required by React Navigation.
 * The color values here should be kept in sync with global.css.
 */

export const AppLightTheme: Theme = {
  dark: false,
  colors: {
    primary: 'rgb(0, 123, 254)',
    background: 'rgb(242, 242, 247)',
    card: 'rgb(255, 255, 255)',
    text: 'rgb(0, 0, 0)',
    border: 'rgb(230, 230, 235)',
    notification: 'rgb(255, 56, 43)',
  },
};

export const AppDarkTheme: Theme = {
  dark: true,
  colors: {
    primary: 'rgb(3, 133, 255)',
    background: 'rgb(0, 0, 0)',
    card: 'rgb(21, 21, 24)',
    text: 'rgb(255, 255, 255)',
    border: 'rgb(40, 40, 42)',
    notification: 'rgb(254, 67, 54)',
  },
};
