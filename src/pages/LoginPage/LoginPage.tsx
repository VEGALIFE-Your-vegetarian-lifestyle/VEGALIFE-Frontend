import { Form, Formik } from 'formik'
import { Link } from 'react-router-dom'
import * as Yup from 'yup'
import { FormField } from '@/components/ui/form'
import { getFieldError } from '@/lib/form-utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PagePlaceholder } from '@/shared/components/PagePlaceholder'

const loginSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
})

export function LoginPage() {
  return (
    <div className="mx-auto max-w-md py-10">
      <PagePlaceholder
        title="Login"
        description="Authenticate with backend-powered credentials once API contracts are available."
      >
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={loginSchema}
          onSubmit={() => undefined}
        >
          {({ values, handleChange, touched, errors }) => (
            <Form className="space-y-4">
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
              <Button type="submit">Sign In</Button>
              <p className="text-sm">
                No account?{' '}
                <Link className="underline" to="/register">
                  Register
                </Link>
              </p>
            </Form>
          )}
        </Formik>
      </PagePlaceholder>
    </div>
  )
}
