import { Form, Formik } from 'formik'
import * as Yup from 'yup'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { getFieldError } from '@/lib/form-utils'
import { Input } from '@/components/ui/input'
import { PagePlaceholder } from '@/shared/components/PagePlaceholder'

const registerSchema = Yup.object({
  name: Yup.string().min(2, 'Name is required').required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
})

export function RegisterPage() {
  return (
    <div className="mx-auto max-w-md py-10">
      <PagePlaceholder
        title="Register"
        description="Create a new account once backend registration is available."
      >
        <Formik
          initialValues={{ name: '', email: '', password: '' }}
          validationSchema={registerSchema}
          onSubmit={() => undefined}
        >
          {({ values, handleChange, touched, errors }) => (
            <Form className="space-y-4">
              <FormField
                label="Name"
                touched={Boolean(touched.name)}
                error={getFieldError(touched, errors, 'name')}
              >
                <Input name="name" value={values.name} onChange={handleChange} />
              </FormField>
              <FormField
                label="Email"
                touched={Boolean(touched.email)}
                error={getFieldError(touched, errors, 'email')}
              >
                <Input name="email" value={values.email} onChange={handleChange} />
              </FormField>
              <FormField
                label="Password"
                touched={Boolean(touched.password)}
                error={getFieldError(touched, errors, 'password')}
              >
                <Input
                  type="password"
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                />
              </FormField>
              <Button type="submit">Create Account</Button>
            </Form>
          )}
        </Formik>
      </PagePlaceholder>
    </div>
  )
}
