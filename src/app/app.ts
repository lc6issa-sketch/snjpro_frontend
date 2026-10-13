import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toasts } from './shared/components/toasts/toasts';
import { Selecteurs } from './shared/components/selecteurs/selecteurs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toasts, Selecteurs],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
