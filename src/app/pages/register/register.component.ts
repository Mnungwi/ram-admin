import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { UntypedFormGroup, UntypedFormControl, AbstractControl, UntypedFormBuilder, Validators, ValidationErrors} from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RegisterComponent {
    public router: Router;
    public form:UntypedFormGroup;
    public name:UntypedFormControl;
    public email:UntypedFormControl;
    public password:UntypedFormControl;
    public confirmPassword:UntypedFormControl;
    
    constructor(router:Router, fb:UntypedFormBuilder){
        this.router = router;
        this.form = fb.group({
            name: ['', Validators.compose([Validators.required, Validators.minLength(3)])],
            email: ['', Validators.compose([Validators.required, emailValidator])],
            password: ['', Validators.required],
            confirmPassword: ['', Validators.required]
        },{validator: matchingPasswords('password', 'confirmPassword')});

        this.name = this.form.controls['name'] as UntypedFormControl;
        this.email = this.form.controls['email'] as UntypedFormControl;
        this.password = this.form.controls['password'] as UntypedFormControl;
        this.confirmPassword = this.form.controls['confirmPassword'] as UntypedFormControl;
    }

     public onSubmit(values:Object):void {
        if (this.form.valid) {
            console.log(values);
            this.router.navigate(['/login']);
        }
    }

    ngAfterViewInit(){
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('hide');
        } 
    }
}

export function emailValidator(control: AbstractControl): ValidationErrors | null {
    const emailRegexp = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/; 
    if (control.value && !emailRegexp.test(control.value)) {
      return { invalidEmail: true };
    } 
    return null;
}

export function matchingPasswords(passwordKey: string, passwordConfirmationKey: string) {
    return (group: UntypedFormGroup) => {
        let password= group.controls[passwordKey];
        let passwordConfirmation= group.controls[passwordConfirmationKey];
        if (password.value !== passwordConfirmation.value) {
            return passwordConfirmation.setErrors({mismatchedPasswords: true})
        }
    }
}
