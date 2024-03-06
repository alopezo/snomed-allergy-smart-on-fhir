import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'; // Import ActivatedRoute
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.css']
})
export class CallbackComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute // Inject ActivatedRoute
  ) {}

  ngOnInit() {
    // Access query parameters
    this.route.queryParams.subscribe(params => {
      console.log('Query Parameters:', params);
      // Here you could look for specific parameters, e.g., `code` for the authorization code
      // Example: console.log('Authorization Code:', params['code']);
    });

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
