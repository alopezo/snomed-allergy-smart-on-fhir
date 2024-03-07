import { Component } from '@angular/core';
import { CodingSpecService } from './services/coding-spec.service';
import { ExcelService } from './services/excel.service';
import { TerminologyService } from './services/terminology.service';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

declare let gtag: Function;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'sct-implementation-demonstrator';
  bindingsForExport: any[] = [];
  editions: any[] = [];
  editionsDetails: any[] = [];
  languages = ['be', 'en', 'es', 'fr', 'no'];
  selectedEdition = 'Edition';
  selectedLanguage = 'en';
  fhirServers = [
    { name: "SNOMED Dev IS", url: "https://dev-is-browser.ihtsdotools.org/fhir"},
    { name: "SNOMED Public", url: "https://snowstorm.ihtsdotools.org/fhir"},
    { name: "SNOMED Dev 2", url: "https://snowstorm-temp.kaicode.io/fhir"},
  ];
  selectedServer = this.fhirServers[1];
  embeddedMode: boolean = true;

  constructor( private codingSpecService: CodingSpecService, 
    public excelService: ExcelService, 
    private terminologyService: TerminologyService, 
    public router: Router,
    private activatedRoute: ActivatedRoute) { 
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Send pageview event to Google Analytics on each route change.
        gtag('config', 'G-7SK998GPMX', {
          'page_path': event.urlAfterRedirects
        });
      }
    });
  }

  ngOnInit(): void {
    this.setFhirServer(this.selectedServer);
    this.bindingsForExport = [];
    let spec: any[] = this.codingSpecService.getCodingSpec();
    for (const section of spec) {
      for (const binding of section.bindings) {
        this.bindingsForExport.push({ section: section.title, title: binding.title, ecl: binding.ecl.replace(/\s\s+/g, ' ') })
      }
    }
    this.updateCodeSystemOptions();
    // this.activatedRoute.queryParams.subscribe(params => {
    //   if (params['embedded'] === 'true') {
    //     this.embeddedMode = true;
    //   } else {
    //     this.embeddedMode = false;
    //   }
    // });
    // this.activatedRoute.queryParams.subscribe(params => {
    //   console.log('Query Parameters app:', params);
    //   // Here you could look for specific parameters, e.g., `code` for the authorization code
    //   // Example: console.log('Authorization Code:', params['code']);
    // });
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }

  updateCodeSystemOptions() {
    this.terminologyService.getCodeSystems().subscribe(response => {
      this.editionsDetails = [];
      this.editions = response.entry;
      let editionNames = new Set();
      this.editions.forEach(loopEdition => {
        editionNames.add(loopEdition.resource.title);
        // editionNames.add(loopEdition.resource.title.substr(0,loopEdition.resource.title.lastIndexOf(' ')));
      });
      editionNames.forEach(editionName => {
        this.editionsDetails.push(
          {
            editionName: editionName,
            editions: this.editions.filter( el => (el.resource.title.includes(editionName))).sort( this.compare )
          }
        );
      });
      const currentVerIndex = this.editionsDetails.findIndex(x => x.editionName === 'International Edition'); //  SNOMED CT release
      if (currentVerIndex >= 0) {
        this.setEdition(this.editionsDetails[currentVerIndex].editions[0]);
      } else {
        this.setEdition(this.editions[0]);
      }
    });
  }

  compare( a: any, b: any ) {
    if ( a.resource.date < b.resource.date ){
      return 1;
    }
    if ( a.resource.date > b.resource.date ){
      return -1;
    }
    return 0;
  }

  setFhirServer(server: any) {
    this.selectedServer = server;
    this.terminologyService.setSnowstormFhirBase(server.url);
    this.selectedEdition = 'Edition';
    this.editions = [];
    this.editionsDetails = [];
    this.updateCodeSystemOptions();
  }

  setEdition(edition: any) {
    this.selectedEdition = edition.resource.title?.replace('SNOMED CT release ','');
    this.terminologyService.setFhirUrlParam(edition.resource.version);
  }

  setLanguage(language: string) {
    this.selectedLanguage = language;
    this.terminologyService.setLang(language);
  }

}
