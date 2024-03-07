import { Component, OnInit, ViewChild } from '@angular/core';
import { AllergiesProblemListComponent } from './allergies-problem-list/allergies-problem-list.component';
import { SnackAlertComponent } from '../alerts/snack-alert';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as FHIR from 'fhirclient';

@Component({
  selector: 'app-allergies',
  templateUrl: './allergies.component.html',
  styleUrls: ['./allergies.component.css']
})

export class AllergiesComponent implements OnInit {

  @ViewChild(AllergiesProblemListComponent) allergiesProblemListComponent!: AllergiesProblemListComponent;

  constructor(private _snackBar: MatSnackBar) { }
  ngOnInit(): void {
    this.initFhirClient();
  }

  private initFhirClient() {
    console.log('Initializing FHIR client in allergy component');
  
    FHIR.oauth2.ready().then(client => {
  
      client.request("/Condition?patient=" + client.patient.id, {
        graph: true
      })
      .then(async (data) => { // Use async here to allow await inside
          // Reject if no Conditions are found
          if (!data.entry || !data.entry.length) {
              throw new Error("No conditions found for the selected patient");
          }
          
          // Get conditions from the entry
          const conditions = data.entry.map((entry: any) => entry.resource);
          console.log('Conditions:', conditions);
          // Call addProblem for each condition
          for (const condition of conditions) {
              await this.addProblem(condition?.code?.coding[0]); // await ensures each addProblem call completes before continuing
          }
      })
      .catch((error) => {
          // Handle errors here
          console.error(error);
          // Optionally, handle error with UI feedback
          this._snackBar.openFromComponent(SnackAlertComponent, {
            duration: 3 * 1000,
            data: "Failed to load conditions",
            panelClass: ['red-snackbar']
          });
          // You can throw the error again if you want the promise rejection to propagate
          throw error;
      });
  
    }).catch(console.error);
  }
  

  async addProblem(problem?: any) {
    this.allergiesProblemListComponent.addProblem(problem);
    this._snackBar.openFromComponent(SnackAlertComponent, {
      duration: 1 * 1000,
      data: "Problem list updated",
      panelClass: ['green-snackbar']
    });
  }

}
