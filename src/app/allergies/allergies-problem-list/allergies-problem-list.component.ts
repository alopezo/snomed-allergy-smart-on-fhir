import { DataSource } from '@angular/cdk/collections';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReplaySubject, Observable, lastValueFrom, map } from 'rxjs';
import { TerminologyService } from '../../services/terminology.service';

const ELEMENT_DATA: any[] = [];
const ELEMENT_DATA2: any[] = [];


@Component({
  selector: 'app-allergies-problem-list',
  templateUrl: './allergies-problem-list.component.html',
  styleUrls: ['./allergies-problem-list.component.css']
})
export class AllergiesProblemListComponent {

  @Output() newAllergy = new EventEmitter<any>();
  @Output() newCondition = new EventEmitter<any>();

  problemBinding = { ecl: '< 404684003 |Clinical finding|', title: 'Search...' };
  eclProblem = '< 404684003 |Clinical finding|';
  selectedProblemSct: any;
  term: string = '';
  displayedColumns: string[] = ['date', 'code', 'display'];
  dataToDisplay = [...ELEMENT_DATA];
  dataSource = new ExampleDataSource(this.dataToDisplay);
  loading = false;
  displayedColumns2: string[] = ['code', 'display'];
  dataToDisplay2 = [...ELEMENT_DATA2];
  dataSource2 = new ExampleDataSource2(this.dataToDisplay2);

  constructor(private terminologyService: TerminologyService) { }

  async updateProblem(event: any) {
    this.selectedProblemSct = event;
  }

  async addProblem(problem?: any) {
    if (this.selectedProblemSct || problem) {
      let newProblem = problem ? problem : this.selectedProblemSct; 
      this.loading = true;
      this.term = newProblem.display;
      newProblem.date = new Date();
      // check if new problem code contains the character :
      if (newProblem.code.indexOf(':') > -1) {
        newProblem.allergy = true;
        let substance = newProblem.substance;
        if (!this.dataToDisplay2.find((x) => x.code === substance.code)) {
          this.dataToDisplay2 = [...this.dataToDisplay2, substance];
          this.dataSource2.setData(this.dataToDisplay2);
        }
      } else {
        const allergyQueryResult: any = await this.getAllergyData(newProblem);
        if (allergyQueryResult?.expansion?.contains?.length > 0) {
          newProblem.allergy = true;
          this.addAllergySubstanceToList(newProblem);
        }
      }

      if (!this.dataToDisplay.find((x) => x.code === newProblem.code)) {
        this.dataToDisplay = [...this.dataToDisplay, newProblem];
        this.dataSource.setData(this.dataToDisplay);
      }
      this.loading = false;
      this.term = "";
    }
  }

  postProblem(problem?: any) {
    let newProblem = problem ? problem : this.selectedProblemSct; 
    // Create new FHIR condition resource and send it to the parent component
    let newFhirConditionResource = {
      resourceType: "Condition",
      subject: {
        reference: "Patient/123"
      },
      code: {
        coding: [
            {
              system: "http://snomed.info/sct",
              code: newProblem.code,
              display: newProblem.display
            }
          ]
         }
    }
    this.newCondition.emit(newFhirConditionResource);  
  }

  async addAllergySubstanceToList(allergy: any) {
    const res: any = await this.getAllergySubstance(allergy);
    res?.expansion?.contains?.forEach((element: any) => {
      if (!this.dataToDisplay2.find((x) => x.code === element.code)) {
        this.dataToDisplay2 = [...this.dataToDisplay2, element];
        this.dataSource2.setData(this.dataToDisplay2);
      }
    });
    // Create new FHIR allergy resource and send it to the parent component (allergy object si a SNOEMD concept)
    let newFhirAllergyIntoleraceResource = {
      resourceType: "AllergyIntolerance",
      patient: {
        reference: "Patient/123"
      },
      code: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: allergy.code,
            display: allergy.display
          }
        ]
      },
      type: "allergy",
      category: ["medication"],
      criticality: "unable-to-assess",
      clinicalStatus: {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
            "code": "active"
          }
        ]
      },
      verificationStatus: {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
            "code": "confirmed"
          }
        ]
      },
      note: [
        {
          "source": "conditionResource"
        }
      ] 
    }
    this.newAllergy.emit(newFhirAllergyIntoleraceResource);
  }

  async getAllergyData(allergy: any): Promise<any> {
    // <<418038007 |Propensity to adverse reactions to substance| OR <<420134006 |Propensity to adverse reaction (finding)|
    // <<473011001 |Allergic condition (finding)|
    const response = await this.terminologyService.expandValueSet('<<418038007 |Propensity to adverse reactions to substance| OR <<420134006 |Propensity to adverse reaction (finding)|', allergy.code,0,1);
    return lastValueFrom(response.pipe(map(res => res)));
  }

  async getAllergySubstance(allergy: any): Promise<any> {
    const response = await this.terminologyService.expandValueSet(`${allergy.code} |${allergy.display}| . (246075003 |Causative agent (attribute)| OR 47429007 |Associated with (attribute)|)`, '');
    return lastValueFrom(response.pipe(map(res => res)));
  }
}

class ExampleDataSource extends DataSource<any> {
  private _dataStream = new ReplaySubject<any[]>();

  constructor(initialData: any[]) {
    super();
    this.setData(initialData);
  }

  connect(): Observable<any[]> {
    return this._dataStream;
  }

  disconnect() {}

  setData(data: any[]) {
    this._dataStream.next(data);
  }
}

class ExampleDataSource2 extends DataSource<any> {
  private _dataStream = new ReplaySubject<any[]>();

  constructor(initialData: any[]) {
    super();
    this.setData(initialData);
  }

  connect(): Observable<any[]> {
    return this._dataStream;
  }

  disconnect() {}

  setData(data: any[]) {
    this._dataStream.next(data);
  }
}