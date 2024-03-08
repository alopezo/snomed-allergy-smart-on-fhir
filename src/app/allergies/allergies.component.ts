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

  conditions: any[] = [];
  allergies: any[] = [];

  smartClient: any;

  constructor(private _snackBar: MatSnackBar) { }
  
  ngOnInit(): void {
    this.initFhirClient();
  }
  
  private initFhirClient() {
    console.log('Initializing FHIR client in allergy component');

    FHIR.oauth2.ready().then(client => {
      this.smartClient = client;
      this.retrieveConditions();
      this.retrieveAllergies(client);
    }).catch(console.error);
  }

  async retrieveConditions() {
    const client = this.smartClient;
    this.conditions = [];
    try {
      const data = await client.request("/Condition?patient=" + client.patient.id, {
        graph: true
      });
      
      if (!data.entry || !data.entry.length) {
          console.log("No conditions found for the selected patient");
      } else {
        console.log('Conditions data: ', data);
        const conditions = data.entry.map((entry: any) => entry.resource);
        conditions.forEach((condition: any) => this.addProblem(condition?.code?.coding[0]));
        this.conditions = conditions;
      }
    } catch (error) {
      console.error(error);
      this.handleError("Failed to load conditions");
    }
  }

  async retrieveAllergies(client: any) {
    this.allergies = [];
    try {
      const data = await client.request("/AllergyIntolerance?patient=" + client.patient.id, {
        graph: true
      });
      if (!data.entry || !data.entry.length) {
          console.log("No allergies found for the selected patient");   
      } else {
        console.log('Allergies data: ', data);
        const allergies = data.entry.map((entry: any) => entry.resource);
        this.allergies = allergies;
      }
    } catch (error) {
      console.error(error);
      this.handleError("Failed to load allergies");
    }
  }

  async postAllergy(allergy: any) {
    const client = this.smartClient;
    try {
      // const data = await client.request("AllergyIntolerance", {
      //   method: "POST",
      //   body: allergy
      // });
      const data = await client.create(allergy);
      console.log('Allergy posted: ', data);
      this.allergies.push(data);
    } catch (error) {
      console.error(error);
      this.handleError("Failed to post allergy");
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
