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

  patientId: string = '';
  conditions: any[] = [];
  allergies: any[] = [];
  medicationRequests: any[] = [];

  smartClient: any;

  constructor(private _snackBar: MatSnackBar) { }
  
  ngOnInit(): void {
    this.initFhirClient();
  }
  
  private initFhirClient() {
    FHIR.oauth2.ready().then(client => {
      this.smartClient = client;
      this.patientId = client.patient.id ? client.patient.id : '';
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
          // console.log("No conditions found for the selected patient");
      } else {
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
          // console.log("No allergies found for the selected patient");   
      } else {
        const allergies = data.entry.map((entry: any) => entry.resource);
        // filter out allergies without patient element
        allergies.forEach((allergy: any) => {
          if (allergy.patient) {
            this.allergies = [...this.allergies, allergy];
            this.retrieveMedicationRequests();
          } else {
          }
        });
      }
    } catch (error) {
      console.error(error);
      this.handleError("Failed to load allergies");
    }
  }

  async retrieveMedicationRequests() {
    const client = this.smartClient;
    try {
      const data = await client.request("/MedicationRequest?patient=" + client.patient.id, {
        resolveReferences: [ "medicationReference" ],
        graph: true
      });
      if (!data.entry || !data.entry.length) {
          // console.log("No medication requests found for the selected patient");
      } else {
        const medicationRequests = data.entry.map((entry: any) => entry.resource);
        this.medicationRequests = medicationRequests;
        this.checkInteractions();
      }
    } catch (error) {
      console.error(error);
      this.handleError("Failed to load medication requests");
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
      this.allergies = [...this.allergies, data];
    } catch (error) {
      console.error(error);
      this.handleError("Failed to post allergy");
    }
  }

  async deleteAllergy(allergy: any) {
    const client = this.smartClient;
    try {
      const data = await client.delete(allergy.resourceType + '/' + allergy.id);
      this.allergies = this.allergies.filter((a) => a.id !== allergy.id);
    } catch (error) {
      console.error(error);
      this.handleError("Failed to delete allergy");
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

  checkInteractions() {
    console.log("Medication requests", this.medicationRequests);
  }

}
