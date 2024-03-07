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
      this.retrieveConditions(client);
      this.retrieveAllergies(client);
    }).catch(console.error);
  }

  private async retrieveConditions(client: any) {
    try {
      const data = await client.request("/Condition?patient=" + client.patient.id, {
        graph: true
      });
      
      if (!data.entry || !data.entry.length) {
          throw new Error("No conditions found for the selected patient");
      }
      console.log('Conditions data: ', data);
      const conditions = data.entry.map((entry: any) => entry.resource);
      conditions.forEach((condition: any) => this.addProblem(condition?.code?.coding[0]));
    } catch (error) {
      console.error(error);
      this.handleError("Failed to load conditions");
    }
  }

  private async retrieveAllergies(client: any) {
    try {
      const data = await client.request("/AllergyIntolerance?patient=" + client.patient.id, {
        graph: true
      });
      console.log('Allergies data: ', data);
      if (!data.entry || !data.entry.length) {
          console.log("No allergies found for the selected patient");
      }
      
      const allergies = data.entry.map((entry: any) => entry.resource);
      // allergies.forEach((allergy: any) => this.addProblem(allergy));
    } catch (error) {
      console.error(error);
      this.handleError("Failed to load allergies");
    }
  }

  private handleError(message: string) {
    this._snackBar.openFromComponent(SnackAlertComponent, {
      duration: 3000,
      data: message,
      panelClass: ['red-snackbar']
    });
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
