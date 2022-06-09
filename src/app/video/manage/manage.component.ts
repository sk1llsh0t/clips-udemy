import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css'],
})
export class ManageComponent implements OnInit, OnDestroy {
  querySubscription: Subscription = new Subscription();
  videoOrder = '1';

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnDestroy(): void {
    if (this.querySubscription) {
      this.querySubscription.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.querySubscription = this.route.queryParams.subscribe(
      (params: Params) => {
        this.videoOrder = params.sort === '2' ? params.sort : '1';
      }
    );
  }

  sort(event: Event) {
    const { value } = event.target as HTMLSelectElement;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sort: value,
      },
    });
  }
}
