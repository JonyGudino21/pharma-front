<script setup lang="ts">
import type { CompanyErrors, CompanyForm } from '~/composables/useTicketStudio'
import SettingsCard from '~/components/settings/SettingsCard.vue'

/**
 * Datos de la farmacia que salen en el encabezado y el pie del ticket.
 * Los errores se muestran junto al campo, al momento, con el mismo criterio
 * que aplica el servidor: no hay que guardar para enterarse.
 */
const form = defineModel<CompanyForm>({ required: true })
defineProps<{ errors: CompanyErrors; dirty: boolean }>()

const FOOTER_MAX = 500
</script>

<template>
  <SettingsCard
    title="Datos de la farmacia"
    description="Encabezan cada ticket. Deben coincidir con tu constancia de situación fiscal."
    icon="ph:storefront-bold"
    :dirty="dirty"
  >
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label for="tk-trade" class="label-base">Nombre comercial</label>
        <input
          id="tk-trade"
          v-model="form.tradeName"
          maxlength="120"
          class="input-base"
          :aria-invalid="!!errors.tradeName"
          aria-describedby="tk-trade-err"
        />
        <p v-if="errors.tradeName" id="tk-trade-err" class="mt-1 text-xs text-error-600">{{ errors.tradeName }}</p>
      </div>

      <div>
        <label for="tk-legal" class="label-base">Razón social</label>
        <input
          id="tk-legal"
          v-model="form.legalName"
          maxlength="160"
          class="input-base"
          :aria-invalid="!!errors.legalName"
          aria-describedby="tk-legal-err"
        />
        <p v-if="errors.legalName" id="tk-legal-err" class="mt-1 text-xs text-error-600">{{ errors.legalName }}</p>
      </div>

      <div>
        <label for="tk-rfc" class="label-base">RFC</label>
        <input
          id="tk-rfc"
          :value="form.rfc"
          maxlength="13"
          autocomplete="off"
          spellcheck="false"
          placeholder="XAXX010101000"
          class="input-base font-mono uppercase tracking-wide"
          :aria-invalid="!!errors.rfc"
          aria-describedby="tk-rfc-help"
          @input="form.rfc = ($event.target as HTMLInputElement).value.toUpperCase().replace(/\s/g, '')"
        />
        <p v-if="errors.rfc" id="tk-rfc-help" class="mt-1 text-xs text-error-600">{{ errors.rfc }}</p>
        <p v-else id="tk-rfc-help" class="mt-1 text-xs text-gray-400">12 caracteres si es empresa, 13 si es persona física.</p>
      </div>

      <div>
        <label for="tk-regime" class="label-base">Régimen fiscal</label>
        <input
          id="tk-regime"
          v-model="form.fiscalRegime"
          maxlength="80"
          placeholder="612 · Personas Físicas con Actividades Empresariales"
          class="input-base"
        />
        <p class="mt-1 text-xs text-gray-400">Sale debajo del RFC.</p>
      </div>

      <div class="md:col-span-2">
        <label for="tk-address" class="label-base">Domicilio</label>
        <input id="tk-address" v-model="form.address" maxlength="300" class="input-base" placeholder="Calle, número, colonia, municipio, estado, C.P." />
      </div>

      <div>
        <label for="tk-phone" class="label-base">Teléfono</label>
        <input id="tk-phone" v-model="form.phone" type="tel" maxlength="30" class="input-base" />
      </div>

      <div>
        <label for="tk-email" class="label-base">Correo</label>
        <input
          id="tk-email"
          v-model="form.email"
          type="email"
          maxlength="120"
          class="input-base"
          :aria-invalid="!!errors.email"
          aria-describedby="tk-email-err"
        />
        <p v-if="errors.email" id="tk-email-err" class="mt-1 text-xs text-error-600">{{ errors.email }}</p>
      </div>

      <div class="md:col-span-2">
        <label for="tk-logo" class="label-base">Logo (dirección de la imagen)</label>
        <input
          id="tk-logo"
          v-model="form.logoUrl"
          type="url"
          placeholder="https://…/logo.png"
          class="input-base"
          :aria-invalid="!!errors.logoUrl"
          aria-describedby="tk-logo-help"
        />
        <p v-if="errors.logoUrl" id="tk-logo-help" class="mt-1 text-xs text-error-600">{{ errors.logoUrl }}</p>
        <p v-else id="tk-logo-help" class="mt-1 text-xs text-gray-400">Sólo se imprime desde el navegador. Sin logo se usa la cruz verde.</p>
      </div>

      <div class="md:col-span-2">
        <div class="flex items-baseline justify-between">
          <label for="tk-footer" class="label-base">Mensaje al pie</label>
          <span class="text-xs tabular-nums" :class="form.ticketFooter.length > FOOTER_MAX - 40 ? 'text-warning-600' : 'text-gray-400'">
            {{ form.ticketFooter.length }}/{{ FOOTER_MAX }}
          </span>
        </div>
        <textarea
          id="tk-footer"
          v-model="form.ticketFooter"
          rows="3"
          :maxlength="FOOTER_MAX"
          class="input-base resize-y"
          placeholder="Ej.: Para devoluciones presente este ticket dentro de los 7 días siguientes."
        />
      </div>
    </div>
  </SettingsCard>
</template>
