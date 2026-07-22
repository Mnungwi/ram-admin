import { Component, ViewEncapsulation, ViewChild } from '@angular/core';
import { DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';


@Component({
  selector: 'app-ngx',
  templateUrl: './ngx.component.html',
  encapsulation: ViewEncapsulation.None
})
export class NgxComponent { 
  editing: any = {};
  rows: any[] = [];
  temp: any[] = [];
  selected: any[] = [];
  loadingIndicator: boolean = true;
  reorderable: boolean = true;

  @ViewChild(DatatableComponent) table: DatatableComponent;
  selection: SelectionType;

  columns = [
    { prop: 'name' },
    { name: 'Gender' },
    { name: 'Company' }
  ];

 constructor() {
    this.selection = SelectionType.checkbox;
    this.fetch((data: any) => {
      this.temp = [...data];
      this.rows = data;
      setTimeout(() => { this.loadingIndicator = false; }, 1500);
    });
  }

  fetch(data: any) {
    const req = new XMLHttpRequest();
    req.open('GET', 'assets/data/company.json');
    req.onload = () => {
      data(JSON.parse(req.response));
    };
    req.send();
  }

  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();
    const temp = this.temp.filter(function(d) {
      return d.name.toLowerCase().indexOf(val) !== -1 || !val;
    });
    this.rows = temp;
    this.table.offset = 0;
  }

  updateValue(event: any, cell: any, cellValue: any, row: any) {
    this.editing[row.$$index + '-' + cell] = false;
    this.rows[row.$$index][cell] = event.target.value;
  }

  onSelect({ selected }: any) {
    console.log('Select Event', selected, this.selected);
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  onActivate(event: any) {
    console.log('Activate Event', event);
  }

}
