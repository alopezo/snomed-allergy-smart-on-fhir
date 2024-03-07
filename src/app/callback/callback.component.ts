import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'; // Import ActivatedRoute
import { AuthService } from '../auth.service';
import * as FHIR from 'fhirclient';

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
      console.log('Query Parameters Callback:', params);
      // Here you could look for specific parameters, e.g., `code` for the authorization code
      // Example: console.log('Authorization Code:', params['code']);
    });

    // this.authService.handleAuth()
    //   .then(() => {
        console.log('Authentication successful in callback, single intent');
        // this.router.navigate([''], { queryParamsHandling: 'preserve' });
        FHIR.oauth2.ready().then(function(client) {
                
          // Render the current patient (or any error)
          client.patient.read().then(
              function(pt) {
                console.log(pt);
              },
              function(error) {
                console.error(error.stack);
              }
          );
          
          // Get MedicationRequests for the selected patient
          client.request("/MedicationRequest?patient=" + client.patient.id, {
              resolveReferences: [ "medicationReference" ],
              graph: true
          })
          
          // Reject if no MedicationRequests are found
          .then(function(data) {
              if (!data.entry || !data.entry.length) {
                  throw new Error("No medications found for the selected patient");
              }
              return data.entry;
          })
          

          // Render the current patient's medications (or any error)
          .then(
              function(meds) {
                console.log(meds);
              },
              function(error) {
                console.error(error.stack);
              }
          );
        }).catch(console.error);
        // this.router.navigate(['']); // Navigate to the main part of the application
      // })
      // .catch(error => {
      //   console.error('Authentication failed', error);
      //   // this.router.navigate(['']); // Navigate to an error page or show an error message
      // });
  }
}
