// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as FHIR from 'fhirclient';
import Client from 'fhirclient/lib/Client';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private fhirClient: Client | null = null; // Property to store the client object

  constructor() {}

  public getFhirClient(): Client | null {
    return this.fhirClient; // Getter to access the client object from other components
  }

  public handleAuth(): Promise<Client> {
    return FHIR.oauth2.ready().then(client => {
      this.fhirClient = client; // Store the client object after authentication
      return client;
    });
  }
  
  // Call this method to start the authorization flow
  public authorize() {
    FHIR.oauth2.authorize({
      clientId: "YOUR_CLIENT_ID",
      scope: "openid fhirUser patient/*.read",
      redirectUri: window.location.origin + "/callback"
    });
  }

}
