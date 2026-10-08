import { useState } from "react";
import { Loader2, X, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { processPhoto } from "@/lib/image";
import {
  BRANDS,
  STORAGES,
  PHOTO_BUCKET,
  guessCategoria,
  type Categoria,
  type Condicao,
  type ProductWithUrls,
} from "@/lib/products";

type Photo = { path?: string; url: string; blob?: Blob };

export function ProductForm({
  initial,
  onDone,
}: {
  initial?: ProductWithUrls;
  onDone: () => void;
}) {
  const [categoria, setCategoria] = useState<Categoria>(initial?.categoria ?? "celular");
  const [manualCat, setManualCat] = useState(!!initial);
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [marca, setMarca] = useState(initial?.marca ?? "");
  const [armazenamento, setArmazenamento] = useState(initial?.armazenamento ?? "");
  const [cor, setCor] = useState(initial?.cor ?? "");
  const [condicao, setCondicao] = useState<Condicao>(initial?.condicao ?? "novo");
  const [bateria, setBateria] = useState(initial?.bateria?.toString() ?? "");
  const [compativel, setCompativel] = useState(initial?.compativel ?? "");
  const [preco, setPreco] = useState(initial?.preco?.toString() ?? "");
  const [photos, setPhotos] = useState<Photo[]>(
    initial?.fotos.map((p, i) => ({ path: p, url: initial.fotoUrls[i] ?? "" })) ?? [],
  );
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);

  const onNome = (v: string) => {
    setNome(v);
    if (!manualCat) {
      const g = guessCategoria(v);
      if (g) setCategoria(g);
    }
  };

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const room = 3 - photos.length;
    const list = Array.from(files).slice(0, room);
    if (files.length > room) toast.info("Máximo de 3 fotos por produto.");
    setProcessing(true);
    try {
      const out: Photo[] = [];
      for (const f of list) {
        const blob = await processPhoto(f);
        out.push({ blob, url: URL.createObjectURL(blob) });
      }
      setPhotos((p) => [...p, ...out].slice(0, 3));
    } catch {
      toast.error("Não foi possível processar uma das fotos.");
    } finally {
      setProcessing(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(preco.replace(",", "."));
    if (!nome.trim()) return toast.error(categoria === "celular" ? "Informe o modelo." : "Informe o nome.");
    if (!Number.isFinite(price) || price < 0) return toast.error("Preço inválido.");
    const bat = bateria ? Number(bateria) : null;
    if (categoria === "celular" && condicao !== "novo" && bat != null && (bat < 0 || bat > 100))
      return toast.error("Saúde da bateria deve ser entre 0 e 100.");
    if (photos.length === 0) return toast.error("Adicione ao menos 1 foto.");

    setBusy(true);
    try {
      const paths: string[] = [];
      for (const ph of photos) {
        if (ph.path) {
          paths.push(ph.path);
          continue;
        }
        const path = `${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(path, ph.blob!, { contentType: "image/jpeg" });
        if (error) throw error;
        paths.push(path);
      }
      const isPhone = categoria === "celular";
      const row = {
        categoria,
        nome: nome.trim().slice(0, 120),
        marca: marca.trim().slice(0, 60) || null,
        modelo: isPhone ? nome.trim().slice(0, 120) : null,
        armazenamento: isPhone ? armazenamento || null : null,
        cor: isPhone ? cor.trim().slice(0, 40) || null : null,
        condicao: isPhone ? condicao : null,
        bateria: isPhone && condicao !== "novo" ? bat : null,
        compativel: isPhone ? null : compativel.trim().slice(0, 200) || null,
        preco: price,
        fotos: paths,
      };
      const { error } = initial
        ? await supabase.from("products").update(row).eq("id", initial.id)
        : await supabase.from("products").insert(row);
      if (error) throw error;
      const removed = initial?.fotos.filter((f) => !paths.includes(f)) ?? [];
      if (removed.length) await supabase.storage.from(PHOTO_BUCKET).remove(removed);
      toast.success(initial ? "Produto atualizado." : "Produto cadastrado.");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select
          value={categoria}
          onValueChange={(v) => {
            setCategoria(v as Categoria);
            setManualCat(true);
          }}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="celular">Celular</SelectItem>
            <SelectItem value="acessorio">Acessório</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{categoria === "celular" ? "Modelo" : "Nome"}</Label>
        <Input
          value={nome}
          maxLength={120}
          onChange={(e) => onNome(e.target.value)}
          placeholder={categoria === "celular" ? "Ex: iPhone 15 Pro Max" : "Ex: Película de vidro 9H"}
        />
      </div>

      {categoria === "celular" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Marca</Label>
              <Select value={marca} onValueChange={setMarca}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {BRANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Armazenamento</Label>
              <Select value={armazenamento} onValueChange={setArmazenamento}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {STORAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Input value={cor} maxLength={40} onChange={(e) => setCor(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Condição</Label>
              <Select value={condicao} onValueChange={(v) => setCondicao(v as Condicao)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="seminovo">Seminovo</SelectItem>
                  <SelectItem value="usado">Usado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {condicao !== "novo" && (
              <div className="space-y-2">
                <Label>Saúde da bateria (%)</Label>
                <Input type="number" inputMode="numeric" min={0} max={100} value={bateria} onChange={(e) => setBateria(e.target.value)} />
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Marca</Label>
            <Input value={marca} maxLength={60} onChange={(e) => setMarca(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Compatível com</Label>
            <Input value={compativel} maxLength={200} onChange={(e) => setCompativel(e.target.value)} placeholder="Ex: iPhone 15, iPhone 14" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Preço (R$)</Label>
        <Input inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="0,00" />
      </div>

      <div className="space-y-2">
        <Label>Fotos ({photos.length}/3)</Label>
        <div className="grid grid-cols-3 gap-3">
          {photos.map((p, i) => (
            <div key={i} className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-muted">
              {p.url && <img src={p.url} alt="" className="h-full w-full object-cover" />}
              <button
                type="button"
                aria-label="Remover foto"
                onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {photos.length < 3 && (
            <label className="grid aspect-[4/5] cursor-pointer place-items-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary">
              {processing ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
              <input
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                className="sr-only"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      </div>

      <Button type="submit" disabled={busy || processing} className="h-11 w-full">
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {initial ? "Salvar alterações" : "Cadastrar produto"}
      </Button>
    </form>
  );
}
