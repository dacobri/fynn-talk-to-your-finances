import { useRegisterActions } from 'kbar';
import { useTheme } from 'next-themes';

const useThemeSwitching = () => {
  const { theme, setTheme } = useTheme();

  const toggleDarkLight = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const themeActions = [
    {
      id: 'toggleDarkLight',
      name: 'Toggle Dark/Light Mode',
      shortcut: ['t', 'h'],
      section: 'Preferences',
      perform: toggleDarkLight
    }
  ];

  useRegisterActions(themeActions, [theme]);
};

export default useThemeSwitching;
