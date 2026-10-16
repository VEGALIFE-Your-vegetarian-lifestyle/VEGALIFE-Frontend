import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/shared/components/FormField";
import {
    LOCATION_TYPES,
    type LocationItem,
    type LocationPayload,
    type LocationType,
    type OpeningHours,
} from "@/types/location";

const MAX_NAME_LENGTH = 255;
const MAX_PHONE_LENGTH = 20;
const MAX_ADDRESS_LENGTH = 255;

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

/** Form chỉ có một khung giờ dùng chung cho cả tuần; dữ liệu cũ khác nhau theo ngày thì lấy giờ của ngày đầu tiên. */
const firstRange = (hours?: OpeningHours) => Object.values(hours ?? {}).find((ranges) => ranges.length > 0)?.[0];

const toOpeningHours = (open: string, close: string): OpeningHours =>
    Object.fromEntries(WEEKDAYS.map((day) => [day, [{ open, close }]]));

// Ô số để trống thì coi là chưa nhập (undefined), không phải lỗi.
const emptyToUndefined = (value: unknown, original: unknown) => (original === "" ? undefined : value);

interface LocationFormProps {
    location: LocationItem | null;
    loading: boolean;
    onSubmit: (payload: LocationPayload) => void;
    onClose: () => void;
}

function LocationForm({ location, loading, onSubmit, onClose }: LocationFormProps) {
    const { t } = useTranslation(["location", "validation", "common"]);

    const schema = useMemo(
        () =>
            Yup.object({
                name: Yup.string()
                    .trim()
                    .required(t("validation:required"))
                    .max(MAX_NAME_LENGTH, t("validation:maxLength", { count: MAX_NAME_LENGTH })),
                address: Yup.string()
                    .trim()
                    .required(t("validation:required"))
                    .max(MAX_ADDRESS_LENGTH, t("validation:maxLength", { count: MAX_ADDRESS_LENGTH })),
                latitude: Yup.number()
                    .typeError(t("admin.validation.number"))
                    .required(t("validation:required"))
                    .min(-90, t("admin.validation.latitude"))
                    .max(90, t("admin.validation.latitude")),
                longitude: Yup.number()
                    .typeError(t("admin.validation.number"))
                    .required(t("validation:required"))
                    .min(-180, t("admin.validation.longitude"))
                    .max(180, t("admin.validation.longitude")),
                placeType: Yup.string().oneOf(LOCATION_TYPES).required(t("validation:required")),
                phoneNumber: Yup.string().max(MAX_PHONE_LENGTH, t("validation:maxLength", { count: MAX_PHONE_LENGTH })),
                websiteUrl: Yup.string().url(t("admin.validation.url")),
                rating: Yup.number()
                    .transform(emptyToUndefined)
                    .typeError(t("admin.validation.number"))
                    .min(0, t("admin.validation.rating"))
                    .max(5, t("admin.validation.rating")),
                priceLevel: Yup.number()
                    .transform(emptyToUndefined)
                    .typeError(t("admin.validation.number"))
                    .integer(t("admin.validation.price"))
                    .min(1, t("admin.validation.price"))
                    .max(4, t("admin.validation.price")),
                // Formik đổi chuỗi rỗng thành undefined trước khi kiểm tra, nên so bằng giá trị "falsy".
                openTime: Yup.string().test("pair", t("admin.validation.hoursPair"), function (value) {
                    return !value || Boolean(this.parent.closeTime);
                }),
                closeTime: Yup.string()
                    .test("pair", t("admin.validation.hoursPair"), function (value) {
                        return !value || Boolean(this.parent.openTime);
                    })
                    .test("order", t("admin.validation.hours"), function (value) {
                        const open = this.parent.openTime as string;
                        return !value || !open || open < value;
                    }),
            }),
        [t],
    );

    // Ô số giữ dạng chuỗi trong form, Yup kiểm tra rồi mới đổi sang số khi gửi.
    const formik = useFormik({
        initialValues: {
            name: location?.name ?? "",
            address: location?.address ?? "",
            latitude: location ? String(location.latitude) : "",
            longitude: location ? String(location.longitude) : "",
            placeType: (location?.placeType ?? "") as LocationType | "",
            phoneNumber: location?.phoneNumber ?? "",
            websiteUrl: location?.websiteUrl ?? "",
            rating: location?.rating !== undefined ? String(location.rating) : "",
            priceLevel: location?.priceLevel !== undefined ? String(location.priceLevel) : "",
            openTime: firstRange(location?.openingHours)?.open ?? "",
            closeTime: firstRange(location?.openingHours)?.close ?? "",
        },
        validationSchema: schema,
        onSubmit: (values) =>
            onSubmit({
                name: values.name.trim(),
                address: values.address.trim(),
                latitude: Number(values.latitude),
                longitude: Number(values.longitude),
                placeType: values.placeType as LocationType,
                // Chuỗi rỗng: khi sửa nghĩa là xóa giá trị đang lưu, khi tạo thì bị bỏ đi.
                phoneNumber: values.phoneNumber.trim(),
                websiteUrl: values.websiteUrl.trim(),
                rating: values.rating === "" ? undefined : Number(values.rating),
                priceLevel: values.priceLevel === "" ? undefined : Number(values.priceLevel),
                // Khi sửa mà xóa trống giờ thì gửi {} để xóa giờ cũ; khi tạo mà chưa nhập thì không gửi.
                openingHours:
                    values.openTime !== "" && values.closeTime !== ""
                        ? toOpeningHours(values.openTime, values.closeTime)
                        : location?.openingHours
                          ? {}
                          : undefined,
            }),
    });

    const fieldError = (name: keyof typeof formik.values) =>
        formik.touched[name] ? (formik.errors[name] as string | undefined) : undefined;

    const textField = (
        name: "name" | "address" | "latitude" | "longitude" | "phoneNumber" | "websiteUrl" | "rating" | "priceLevel",
        label: string,
        required = false,
    ) => (
        <FormField label={label} htmlFor={name} required={required} error={fieldError(name)}>
            <Input
                id={name}
                name={name}
                value={formik.values[name]}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={formik.touched[name] && !!formik.errors[name]}
            />
        </FormField>
    );

    return (
        <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
            {textField("name", t("admin.form.name"), true)}
            {textField("address", t("admin.form.address"), true)}
            <div className="grid grid-cols-2 gap-4">
                {textField("latitude", t("admin.form.latitude"), true)}
                {textField("longitude", t("admin.form.longitude"), true)}
            </div>
            <FormField label={t("admin.form.type")} htmlFor="placeType" required error={fieldError("placeType")}>
                <Select
                    id="placeType"
                    name="placeType"
                    value={formik.values.placeType}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                >
                    <option value="">{t("admin.form.noType")}</option>
                    {LOCATION_TYPES.map((type) => (
                        <option key={type} value={type}>
                            {t(`type.${type}`)}
                        </option>
                    ))}
                </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
                {textField("rating", t("admin.form.rating"))}
                {textField("priceLevel", t("admin.form.price"))}
            </div>
            {textField("phoneNumber", t("admin.form.phone"))}
            {textField("websiteUrl", t("admin.form.website"))}
            <div className="grid grid-cols-2 gap-4">
                <FormField label={t("admin.form.openTime")} htmlFor="openTime" error={fieldError("openTime")}>
                    <Input
                        id="openTime"
                        name="openTime"
                        type="time"
                        value={formik.values.openTime}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                    />
                </FormField>
                <FormField label={t("admin.form.closeTime")} htmlFor="closeTime" error={fieldError("closeTime")}>
                    <Input
                        id="closeTime"
                        name="closeTime"
                        type="time"
                        value={formik.values.closeTime}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                    />
                </FormField>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                    {t("common:cancel")}
                </Button>
                <Button type="submit" disabled={loading}>
                    {location ? t("admin.form.save") : t("admin.create")}
                </Button>
            </div>
        </form>
    );
}

interface LocationFormDialogProps extends LocationFormProps {
    open: boolean;
}

export function LocationFormDialog({ open, location, loading, onSubmit, onClose }: LocationFormDialogProps) {
    const { t } = useTranslation("location");

    return (
        <Dialog open={open} onClose={onClose} title={t(location ? "admin.form.editTitle" : "admin.form.createTitle")}>
            <LocationForm location={location} loading={loading} onSubmit={onSubmit} onClose={onClose} />
        </Dialog>
    );
}
