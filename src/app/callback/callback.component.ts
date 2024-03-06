import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.css']
})
export class CallbackComponent implements OnInit {

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    const url = window.location.href;
    const queryString = url.split('?')[1];
    if (queryString) {
      const urlParams = new URLSearchParams(queryString);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      console.log('Authorization Code:', code);
      console.log('State:', state);
      
      // Proceed with your authorization flow here
    }

    this.authService.handleAuth()
      .then(() => {
        console.log('Authentication successful');
        this.router.navigate(['/']); // Navigate to the main part of the application
      })
      .catch(error => {
        console.error('Authentication failed', error);
        this.router.navigate(['/error']); // Adjust as needed
      });
  }
}
