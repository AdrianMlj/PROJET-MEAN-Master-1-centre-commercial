import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false
})
export class AppComponent implements OnInit {
  title = 'Centre Commercial';
  showNavbar = true;
  showFooter = true;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      // Hide navbar for acheteur and admin sections (they have their own sidebar)
      this.showNavbar = !url.startsWith('/acheteur') &&
                        !url.startsWith('/admin') &&
                        !url.startsWith('/boutique');
      // Footer is always shown
      this.showFooter = true;
    });
  }
}