import { Form, Formik } from 'formik'
import * as Yup from 'yup'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { getFieldError } from '@/lib/form-utils'
import { PagePlaceholder } from '@/shared/components/PagePlaceholder'

const profileSchema = Yup.object({
  displayName: Yup.string().required('Display name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
})

export function UserProfilePage() {
  return (
    <PagePlaceholder
      title="User Profile"
      description="Manage profile preferences and account settings."
    >
      <div className="max-w-md">
        <Formik
          initialValues={{ displayName: '', email: '' }}
          validationSchema={profileSchema}
          onSubmit={() => undefined}
        >
          {({ values, handleChange, touched, errors }) => (
            <Form className="space-y-4">
              <FormField
                label="Display Name"
                touched={Boolean(touched.displayName)}
                error={getFieldError(touched, errors, 'displayName')}
              >
                <Input name="displayName" value={values.displayName} onChange={handleChange} />
              </FormField>
              <FormField
                label="Email"
                touched={Boolean(touched.email)}
                error={getFieldError(touched, errors, 'email')}
              >
                <Input name="email" value={values.email} onChange={handleChange} />
              </FormField>
              <Button type="submit">Save Profile</Button>
            </Form>
          )}
        </Formik>
      </div>
    </PagePlaceholder>
  )
}
