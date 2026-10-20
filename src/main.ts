import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent).catch((erro) => {
  console.error('Erro ao iniciar o aplicativo:', erro);
});