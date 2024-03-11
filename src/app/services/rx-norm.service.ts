import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { SnackAlertComponent } from '../alerts/snack-alert';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class RxNormService {

  constructor(private http: HttpClient, private _snackBar: MatSnackBar) { }

  getRxNormCode(medication: string) {
    let requestUrl = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${medication}`;
    return this.http.get<any>(requestUrl)
      .pipe(
        catchError(this.handleError<any>('getRxNormCode', {}))
      );
  }

  getIngredients(rxNormCode: string) {
    let requestUrl = `https://rxnav.nlm.nih.gov/REST/rxcui/${rxNormCode}/related.json?tty=IN`;
    return this.http.get<any>(requestUrl)
      .pipe(
        catchError(this.handleError<any>('getIngredients', {}))
      );
  }

  getSNOMEDCode(rxNormCode: string) {
    let requestUrl = `https://rxnav.nlm.nih.gov/REST/rxcui/${rxNormCode}/property?propName=SNOMEDCT`;
    return this.http.get<any>(requestUrl)
      .pipe(
        catchError(this.handleError<any>('getSNOMEDCode', {}))
      );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error("There was an error!");
      console.error(error);
      this._snackBar.openFromComponent(SnackAlertComponent, {
        duration: 5 * 1000,
        data: error.message,
        panelClass: ['red-snackbar']
      });
      // TODO: send the error to remote logging infrastructure
      // console.error(error); // log to console instead
  
      // TODO: better job of transforming error for user consumption
      // console.log(`${operation} failed: ${error.message}`);
  
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
