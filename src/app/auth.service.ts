// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as FHIR from 'fhirclient';
import Client from 'fhirclient/lib/Client';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private fhirClient = new BehaviorSubject<Client | null>(null);

  constructor() {}

  public getFhirClient() {
    return this.fhirClient.asObservable(); // This provides a stream that components can subscribe to
  }

  public handleAuth(): Promise<Client> {
    return FHIR.oauth2.ready().then(client => {
      this.fhirClient.next(client); // Notify subscribers that the client is ready
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
