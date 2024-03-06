import { Injectable } from '@angular/core';
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
  
      // Extract and log the access token
      const tokenResponse = client.state.tokenResponse;
      if (tokenResponse && tokenResponse.access_token) {
        console.log("Access Token:", tokenResponse.access_token);
      } else {
        console.error("Access token is undefined. Token response:", tokenResponse);
      }
  
      return client;
    }).catch(error => {
      console.error("Error in OAuth2 flow:", error);
      throw error; // Rethrow the error to ensure it's caught where handleAuth is called
    });
  }
  
}
