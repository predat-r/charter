import { render } from 'preact';
import { App } from './app';
import { initializeTheme } from './lib/theme';
import './styles/global.css';

initializeTheme();

render(<App />, document.getElementById('app')!);