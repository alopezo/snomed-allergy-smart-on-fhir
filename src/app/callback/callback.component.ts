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
    this.authService.handleAuth()
      .then(() => {
        console.log('Authentication successful');
        this.router.navigate(['']); // Navigate to the main part of the application
      })
      .catch(error => {
        console.error('Authentication failed', error);
        this.router.navigate(['']); // Navigate to an error page or show an error message
      });
  }
}