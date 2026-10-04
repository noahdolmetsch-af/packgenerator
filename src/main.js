import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

// Svelte renders the App component into <div id="app"> in index.html.
mount(App, { target: document.getElementById('app') });
