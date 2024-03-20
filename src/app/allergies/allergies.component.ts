import { Component, OnInit, ViewChild } from '@angular/core';
import { AllergiesProblemListComponent } from './allergies-problem-list/allergies-problem-list.component';
import { SnackAlertComponent } from '../alerts/snack-alert';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as FHIR from 'fhirclient';
import { RxNormService } from '../services/rx-norm.service';
import { AllergiesAllergyListComponent } from './allergies-allergy-list/allergies-allergy-list.component';
import { TerminologyService } from '../services/terminology.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-allergies',
  templateUrl: './allergies.component.html',
  styleUrls: ['./allergies.component.css']
})

export class AllergiesComponent implements OnInit {

  @ViewChild(AllergiesProblemListComponent) allergiesProblemListComponent!: AllergiesProblemListComponent;
  @ViewChild(AllergiesAllergyListComponent) allergiesListComponent!: AllergiesAllergyListComponent;

  patientId: string = '';
  conditions: any[] = [];
  allergies: any[] = [];
  medicationRequests: any[] = [];

  smartClient: any;

  constructor(private _snackBar: MatSnackBar, 
    private terminologyService: TerminologyService,
    private rxNormService: RxNormService) { }
  
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
            let allergyCode = allergy.code.coding[0];
            this.terminologyService.expandValueSet(`> ${allergyCode.code} |${allergyCode.display}| AND 
            (404684003 |Clinical finding (finding)| OR 105590001 |Substance (substance)| OR 373873005 |Pharmaceutical / biologic product (product)|)`, '').subscribe((data: any) => {
              if (data.expansion.contains?.length > 0) {
                let ancestor = data.expansion.contains[0];
                if (ancestor.code == "404684003") {
                  // Is a clinical finding
                  allergyCode.note = [{ source: "Allergy"}];
                  this.allergiesProblemListComponent.addProblem(allergyCode, false);
                  this.allergiesProblemListComponent.allergyListBasedConditions = true;
                } else if (ancestor.code == "105590001") {
                  // Is a substance
                } else if (ancestor.code == "373873005") {
                  // Is a product
                }
              }
            });
          }
        });
        this.retrieveMedicationRequests();
      }
    } catch (error) {
      console.error(error);
      this.handleError("Failed to load allergies");
    }
  }

  addAllergy(allergy: any) {
    this.allergies = [...this.allergies, allergy];
    this.allergiesListComponent.conditionBasedAllergies = true;
  }

  async retrieveMedicationRequests() {
    const client = this.smartClient;
    try {
      const data = await client.request("/MedicationRequest?patient=" + client.patient.id, {
        resolveReferences: [ "medicationReference" ],
        graph: true
      });
      if (!data.entry || !data.entry.length) {
          console.log("No medication requests found for the selected patient");
          console.log(data);
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

  async postCondition(condition: any) {
    const client = this.smartClient;
    try {
      condition.subject = {
        reference: "Patient/" + this.patientId
      };
      const data = await client.create(condition);
    } catch (error) {
      console.error(error);
      this.handleError("Failed to post condition");
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

async checkInteractions() {
  console.log("Medication requests", this.medicationRequests);
  let ingredients: any[] = [];
  const ingredientsPromises = this.medicationRequests.map(async (medicationRequest: any) => {
    let system = medicationRequest.medicationCodeableConcept?.coding[0]?.system;
    console.log("System", system);
    if (system == 'http://snomed.info/sct') {
        ingredients.push(medicationRequest.medicationCodeableConcept.coding[0]);
    } else if (system == 'http://www.nlm.nih.gov/research/umls/rxnorm') {
        console.log("Is RxNorm");
        let rxNavMedication = medicationRequest.medicationCodeableConcept.coding[0];
        const data = await firstValueFrom(this.rxNormService.getIngredients(rxNavMedication.code));
        if (data.relatedGroup.conceptGroup) {
          let conceptProperties = data.relatedGroup.conceptGroup[0].conceptProperties;
          for (const ingredient of conceptProperties) {
            const snomedData = await firstValueFrom(this.rxNormService.getSNOMEDCode(ingredient.rxcui));
            for (let prop of snomedData.propConceptGroup.propConcept) {
              let snomedCode = prop.propValue;
              ingredients.push({
                code: snomedCode,
                display: ingredient.name,
                system: 'http://snomed.info/sct'
              });
            }
          }
        }
    }
  });

  // Wait for all medication requests to be processed
  await Promise.all(ingredientsPromises);
  console.log("Ingredients", ingredients);
}


}
